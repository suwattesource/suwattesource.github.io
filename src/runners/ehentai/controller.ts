import {
    Content,
    DirectoryFilter,
    DirectoryRequest,
    FilterType,
    Highlight,
    NetworkRequest,
    NetworkRequestConfig,
    Option,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {
    CATEGORIES,
    EHENTAI_DOMAIN,
    EHENTAI_TAG_LINKS,
    EXTENDED_DISPLAY_COOKIE,
    FILTERS,
    HOME_PAGE_SECTIONS,
    LOGIN_COOKIES,
    PREF_KEYS,
} from "./constants";
import {Parser} from "./parser";
import {load} from "cheerio";
import {Cache} from "memory-cache";
import {female, male, mixed, other} from "./filters.json"
import {GlobalStore} from "./store";
import {startCase} from "lodash";

export class Controller {
    private client = new NetworkClient();
    private parser = new Parser();
    private cache = new Cache<string, any>

    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            let url: string;
            switch (section.id) {
                case 'popular':
                    url = `${EHENTAI_DOMAIN}/popular`;
                    break;
                case 'front_page':
                    url = EHENTAI_DOMAIN;
                    break;
                default:
                    throw new Error("Invalid homepage section ID");
            }
            promises.push(
                this.fetchHTML(url, {cookies: [EXTENDED_DISPLAY_COOKIE]}).then(async ($) => {
                    const items = await this.parser.getHomepageSection($, section.id)
                    sections.push({...section, items})
                })
            )
        }
        await Promise.all(promises)
        const sectionIdInOrder = HOME_PAGE_SECTIONS.map((section) => {
            return section.id
        })
        sections.sort((a, b) => sectionIdInOrder.indexOf(a.id) - sectionIdInOrder.indexOf(b.id));
        return sections;

    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const searchUrl = await this.createSearchURL(request)
        const $ = await this.fetchHTML(searchUrl, {cookies: [EXTENDED_DISPLAY_COOKIE]})
        let results: Highlight[]
        if (searchUrl.includes("toplist")) {
            results = await this.parser.getToplistGalleries($)
        } else {
            results = await this.parser.getSearchResults($);
        }
        const nextId = await this.parser.getNextId($)

        return {
            results,
            isLastPage: nextId == "0"
        };
    }

    async getFilters() {
        const filters = FILTERS
        filters.push(...await this.getFilterTags())
        return filters
    }

    async createSearchURL(request: DirectoryRequest): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {filters, listId, query, tag, sort, page} = request

        if (!query && !tag && sort && sort.id == "lt") {
            request = <DirectoryRequest>this.cache.get(PREF_KEYS.cache_request) ?? request
            query = request.query
            tag = request.tag

        }
        let url = EHENTAI_DOMAIN
        let nextId = "0"
        if (page > 1) {
            nextId = await ObjectStore.string(PREF_KEYS.cache_next_id) || "0"
        }
        if (filters) {
            const excludedCategories = filters.category ?? []
            const combineCategoryId = excludedCategories.map((tag: string) => parseInt(tag)).reduce((prev: number, cur: number) => prev + cur, 0)
            const tagTypes = ['male', 'female', 'mixed', 'other'];

            let keyword = "";
            tagTypes.forEach(tagType => {
                const includeTags = filters[tagType]?.included ?? [];
                const excludeTags = filters[tagType]?.excluded ?? [];

                includeTags.forEach((tag: string) => {
                    keyword += ` ${tag.replace(/(\w+):(.+)/, '$1:"$2"')}`;
                });

                excludeTags.forEach((tag: string) => {
                    keyword += ` -${tag.replace(/(\w+):(.+)/, '$1:"$2"')}`;
                });
            });
            keyword = keyword.trim()
            if (!keyword) {
                const cacheUrl = <string>this.cache.get(PREF_KEYS.cache_request_url) || EHENTAI_DOMAIN;
                url = cacheUrl + (cacheUrl.includes("?") ? `&f_cats=${combineCategoryId}` : `?f_cats=${combineCategoryId}`);
                return url + (url.includes("?") ? `&next=${nextId}` : `?next=${nextId}`);
            }
            return `${EHENTAI_DOMAIN}?f_search=${encodeURI(keyword)}&f_cats=${combineCategoryId}&next=${nextId}`
        }

        if (listId) {
            url += `/toplist.php?tl=${listId}`
            this.cache.del(PREF_KEYS.cache_request_url)
        }

        if (query) {
            url += `/?f_search=${encodeURI(query)}`
        }

        if (tag) {
            switch (tag.propertyId) {
                case "uploader":
                    url += `/uploader/${encodeURI(tag.tagId)}`
                    break
                case "category":
                    // eslint-disable-next-line no-case-declarations
                    const categoryId = CATEGORIES.filter(category => category.title == tag?.tagId)[0]?.id
                    url += `/?f_cats=${1023 - Number(categoryId)}`
                    break
                default:
                    url += `/tag/${encodeURI(tag.tagId)}`
            }
        }

        this.cache.put(PREF_KEYS.cache_request, request)
        this.cache.put(PREF_KEYS.cache_request_url, url)
        if (url == EHENTAI_DOMAIN) {
            this.cache.del(PREF_KEYS.cache_request_url)
        }
        url = url + (url.includes("?") ? `&next=${nextId}` : `?next=${nextId}`);
        return url;
    }

    // Content
    async getContent(contentId: string): Promise<Content> {
        const [gallery, $] = await Promise.all(
            [
                this.getGalleryData([contentId]),
                this.fetchHTML(`https://e-hentai.org/g/${contentId}`)
            ]
        );
        return this.parser.getContent(gallery, $, contentId);
    }

    async getChapterData(contentId: string, chapterId: string) {
        const response = await this.client.get(`https://e-hentai.org/g/${contentId}/?p=${Number(chapterId) - 1}`);
        const $ = load(response.data);
        const pages = await this.parser.parsePage($)
        void this.preload(pages)
        return {
            pages: pages.map((url) => ({url})),
        };
    }

    async preload(images: string[]) {
        for (const image of images) {
            void this.client.get(image, {headers: {Referer: EHENTAI_DOMAIN + "/"}})
        }
    }

    async getTags(): Promise<Option[]> {
        const cachedTags = <Option[]>this.cache.get(PREF_KEYS.cache_tags)
        if (cachedTags) {
            return cachedTags
        }
        const tags: Option[] = [];
        const pagePromises = [];
        for (const url of EHENTAI_TAG_LINKS) {
            pagePromises.push(this.fetchHTML(url, {cookies: LOGIN_COOKIES}))
        }
        const pages = await Promise.all(pagePromises);
        pages.forEach(page => {
            tags.push(...this.parser.getTags(page));
        });
        this.cache.put(PREF_KEYS.cache_tags, tags)
        return tags;
    }

    async getFilterTags(): Promise<DirectoryFilter[]> {
        const excludeTags = await GlobalStore.getExcludeTags()
        const maleFilter: DirectoryFilter = {
            id: "male",
            title: "Male",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: male.filter(
                v => !excludeTags.includes(v.title)).map(
                v => (
                    {
                        id: v.id.split(":")[1] ?? "",
                        title: startCase(v.title.split(":")[1] ?? ""),
                    }),
            ),
        }
        const femaleFilter: DirectoryFilter = {
            id: "female",
            title: "Female",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: female.filter(
                v => !excludeTags.includes(v.title)).map(
                v => (
                    {
                        id: v.id.split(":")[1] ?? "",
                        title: startCase(v.title.split(":")[1] ?? ""),
                    }),
            ),
        }
        const mixedFilter: DirectoryFilter = {
            id: "mixed",
            title: "Mixed",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: mixed.filter(
                v => !excludeTags.includes(v.title)).map(
                v => (
                    {
                        id: v.id.split(":")[1] ?? "",
                        title: startCase(v.title.split(":")[1] ?? ""),
                    }),
            ),
        }
        const otherFilter: DirectoryFilter = {
            id: "other",
            title: "Other",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: other.filter(
                v => !excludeTags.includes(v.title)).map(
                v => (
                    {
                        id: v.id.split(":")[1] ?? "",
                        title: startCase(v.title.split(":")[1] ?? ""),
                    }),
            ),
        }
        return [maleFilter, femaleFilter, mixedFilter, otherFilter]
    }

    private async getGalleryData(ids: string[]): Promise<any> {
        const req = {
            url: "https://api.e-hentai.org/api.php",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": EHENTAI_DOMAIN + "/",
            },
            body: {
                "method": "gdata",
                "gidlist": ids.map(id => id.split('/')),
                "namespace": 1
            }
        }

        const json = await this.requestJSON(req)
        return json.gmetadata?.[0]
    }

    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }

    private async requestJSON(request: NetworkRequest) {
        console.log(`Performing JSON request: ${JSON.stringify(request)}`);
        const {data: resp} = await this.client.request(request)
        return JSON.parse(resp) ?? resp
    }
}
