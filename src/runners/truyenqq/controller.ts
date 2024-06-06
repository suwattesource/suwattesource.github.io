import {
    ChapterData,
    DirectoryRequest,
    NetworkClientBuilder,
    NetworkRequestConfig,
    PagedResult,
    PageSection,
    User
} from "@suwatte/daisuke";
import {load} from "cheerio";
import {FOLLOW, GET_FOLLOW_TOKEN, HOME_PAGE_SECTIONS, LOGIN, PREF_KEYS, SESSION_COOKIE} from "./constants";
import {Parser} from "./parser";
import {AuthInterceptor, generateCookie, getAPIUrl} from "./utils";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {isNumber} from "../../utils/utils";

export class Controller {
    private client = new NetworkClientBuilder()
        .addRequestInterceptor(AuthInterceptor)
        .build();
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        let defaultCheerio = load("")
        for (const section of HOME_PAGE_SECTIONS) {
            let url: string;
            switch (section.id) {
                case 'suggested':
                case 'latest':
                    url = domain;
                    break;
                case 'favorite':
                    url = domain + "/truyen-yeu-thich.html"
                    break
                case 'top_month':
                    url = domain + "/top-thang.html";
                    break;
                default:
                    throw new Error("Invalid homepage section ID");
            }
            if ((section.id == "suggested") || (url != domain)) {
                promises.push(
                    this.fetchHTML(url).then(async ($) => {
                        if (url == domain) {
                            defaultCheerio = $
                        }
                        const items = this.parser.getHomepageSection($, section.id)
                        sections.push({...section, items})
                    })
                );
            }

        }

        await Promise.all(promises)
        for (const section of HOME_PAGE_SECTIONS) {
            if (['latest'].includes(section.id)) {
                const items = this.parser.getHomepageSection(defaultCheerio, section.id)
                sections.push({...section, items})
            }
        }
        const sectionIdInOrder = HOME_PAGE_SECTIONS.map((section) => {
            return section.id
        })
        sections.sort((a, b) => sectionIdInOrder.indexOf(a.id) - sectionIdInOrder.indexOf(b.id));
        return sections.filter(a => a.items?.length);
    }


    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const domain = await GlobalStore.getDomain()
        const searchUrl = await this.createSearchURL(request, domain)
        const $ = await this.fetchHTML(searchUrl)
        const results = this.parser.getSearchResults($, false);
        return {
            results,
            isLastPage: false
        };
    }

    async getFilters() {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/tim-kiem-nang-cao.html`)
        return this.parser.getFilters($);
    }

    async createSearchURL(request: DirectoryRequest, domain: string): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {filters, listId, query, tag, sort, page} = request;
        if (!filters && !query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        const sort_id = sort && sort.id ? Number(sort.id) + (sort.ascending ? 1 : 0) : 2;

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            const search = {
                category: '',
                notcategory: '',
                country: "-1",
                status: "-1",
                minchapter: "1",
            };

            const includeCategories = filters.category?.included ?? [];
            const excludeCategories = filters.category?.excluded ?? [];

            search.category = includeCategories.join(",");
            search.notcategory = excludeCategories.join(",");
            search.minchapter = filters.minchapter ?? "0"
            search.country = filters.country ?? "0"
            search.status = filters.status ?? "-1"

            const paramExcategories = search.notcategory ? `&notcategory=${search.notcategory}` : '';

            const url = `${domain}/tim-kiem-nang-cao/trang-${page}.html`;
            const param = `?category=${search.category}${paramExcategories}&country=${search.country}&status=${search.status}&minchapter=${search.minchapter}&sort=${sort_id}`;
            return url + param
        }

        if (listId) {
            let url: string
            if (listId === "followed") {
                url = `${domain}/truyen-dang-theo-doi/trang-${page}.html`
            } else {
                url = `${domain}/lich-su/trang-${page}.html`
            }
            return url
        }

        if (query) {
            return `${domain}/tim-kiem/trang-${page}.html${encodeURI(`?q=${query.trim()}`)}`
        }

        if (tag) {
            let tagId = ""
            switch (tag.propertyId) {
                case "category": {
                    if (isNumber(tag.tagId)) {
                        tagId = `${domain}/tim-kiem-nang-cao/trang-${page}.html?category=${tag.tagId}&sort=${sort_id}`;
                        break;
                    }
                    tagId = tag.tagId.replace(".html", `/trang-${page}.html?sort=${sort_id}`)
                    break;
                }
                case "author": {
                    tagId = tag.tagId.replace(".html", `/page-${page}.html`);
                    break;
                }
                case "country": {
                    tagId = `${domain}/tim-kiem-nang-cao/trang-${page}.html?country=${tag.tagId}&sort=${sort_id}`;
                    break;
                }
                case "minchapter": {
                    tagId = `${domain}/tim-kiem-nang-cao/trang-${page}.html?minchapter=${tag.tagId}&sort=${sort_id}`;
                    break;
                }
                case "status": {
                    tagId = `${domain}/tim-kiem-nang-cao/trang-${page}.html?status=${tag.tagId}&sort=${sort_id}`;
                    break;
                }
            }
            return tagId.includes(domain) ? tagId : domain + tagId
        }

        return `${domain}/tim-kiem-nang-cao/trang-${page}.html?sort=${sort_id}`
    }

    // Content
    async getContent(contentId: string) {
        const domain = await GlobalStore.getDomain();
        contentId = contentId.replace('http://', 'https://')
        const webUrl = contentId.replace('http://', 'https://').includes(domain) ? contentId : domain + contentId;
        const $ = await this.fetchHTML(webUrl);
        return this.parser.getContent($, webUrl);
    }

    // Chapters
    async getChapters(contentId: string) {
        const domain = await GlobalStore.getDomain();
        const $ = await this.fetchHTML(`${domain}/truyen-tranh/${contentId}`)
        return this.parser.getChapters($);
    }

    async getChapterData(chapterId: string) {
        const domain = await GlobalStore.getDomain();
        const chapterUrl = chapterId.replace('http://', 'https://').includes(domain) ? chapterId : domain + chapterId;
        const $ = await this.fetchHTML(chapterUrl);
        const chapterData = await this.parser.getChapterData($);
        void this.preload(chapterData)
        return chapterData
    }

    async preload(chapterData: ChapterData) {
        const domain = await GlobalStore.getDomain();
        const pages = chapterData.pages || []
        for (const page of pages) {
            if (page.url != null) {
                void this.client.get(page.url, {headers: {Referer: domain + "/"}})
            }
        }
    }

    async handleAuth(username: string, password: string) {
        const domain = await GlobalStore.getDomain();
        const sessionCookie = generateCookie()
        const cookies = [
            {
                "name": SESSION_COOKIE,
                "value": sessionCookie,
            }
        ]
        await this.client.request(
            {
                url: domain + LOGIN,
                headers: {
                    "content-type": "application/x-www-form-urlencoded",
                    "x-requested-with": "XMLHttpRequest"
                },
                cookies: cookies,
                body: {
                    email: username,
                    password: password,
                    expire: 1
                },
                method: "POST"
            }
        )
        await SecureStore.set("session", sessionCookie);
        await SecureStore.set("avatar", "nha");
        await SecureStore.set("name", "nha");
    }

    async getAuthUser() {
        const session = await SecureStore.get("session");
        if (!session) {
            return null;
        }

        const name = await SecureStore.string("session") || "";
        const avatar = await SecureStore.string("session") || "";

        const user: User = {
            handle: name,
            avatar: avatar
        };

        return user;
    }

    async followManga(_: string): Promise<void> {
        const comicId = await ObjectStore.get(PREF_KEYS.comicId)
        const comicToken = await ObjectStore.get(PREF_KEYS.comicToken)
        const getFollowTokenApiUrl = `${await getAPIUrl(GET_FOLLOW_TOKEN)}?comicId=${comicId}&token=${comicToken}`
        console.log(getFollowTokenApiUrl)
        let resp = await this.client.get(getFollowTokenApiUrl)
        const data = JSON.parse(resp.data)
        console.log(data)
        const followApiUrl = `${await getAPIUrl(FOLLOW)}?comicId=${comicId}&token=${data.data}`
        resp = await this.client.get(followApiUrl)
        console.log(JSON.parse(resp.data))
    }

    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }
}
