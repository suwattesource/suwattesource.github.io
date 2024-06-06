import {
    ChapterData,
    DirectoryFilter,
    DirectoryRequest,
    NetworkRequestConfig,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {load} from "cheerio";
import {
    HOME_PAGE_SECTIONS,
    LOAD_LIST_MANGA,
    LOAD_MANGA_BY_AUTHOR,
    LOAD_MANGA_BY_CATEGORY,
    LOAD_MANGA_BY_TRANSLATE_TEAM,
    LOAD_MANGA_CREATED,
    PREF_KEYS,
} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {getCategoryId, getId} from "./util";
import {SearchConfig} from "./type";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, string | DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        let defaultCheerio = load("")
        for (const section of HOME_PAGE_SECTIONS) {
            let url: string;
            if (section.id == "top-hot") {
                url = domain.replace("//", "//m.") + "/truyenhot"
            } else {
                url = domain
            }
            if ((section.id == "trending") || (url != domain)) {
                promises.push(
                    this.fetchHTML(url).then(async ($) => {
                        if (url == domain) {
                            defaultCheerio = $
                            return
                        }
                        const items = this.parser.getHomepageSection($, section.id)
                        sections.push({...section, items})
                    })
                );
            }

        }
        await Promise.all(promises)
        for (const section of HOME_PAGE_SECTIONS) {
            if (section.id != "top-hot") {
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
        const searchConfig = await this.createSearchConfig(request, domain)
        const $ = await this.fetchHTML(searchConfig.url)
        let parseFunction = this.parser.getSearchResults
        if (searchConfig.func) {
            parseFunction = searchConfig.func.bind(this.parser)
        }
        const results = parseFunction($)

        return {
            results,
            isLastPage: false
        };
    }

    async createSearchConfig(request: DirectoryRequest, domain: string): Promise<SearchConfig> {
        // eslint-disable-next-line prefer-const
        let {configID, filters, query, tag, sort, page} = request;

        if (configID) {
            return {
                url: `${domain}/page-${page}`,
                func: this.parser.getNewUpdateMangas
            }
        }

        if (!filters && !query && !tag && sort?.id) {
            request = <DirectoryRequest>this.cache.get(PREF_KEYS.request) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "5"

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            const includeCategories = filters.categories?.included ?? [];
            const excludeCategories = filters.categories?.excluded ?? [];
            const categories = includeCategories.join(",");
            const exCategories = excludeCategories.join(",");
            const status = filters.status ?? "0"
            return {
                url: `${domain}/timkiem/nangcao/1/${status}/${categories}/${exCategories}?p=${page}`
            }
        }

        if (query) {
            return {
                url: `${domain}/timkiem/nangcao/1/0/-1/-1?txt=${query}&p=${page}`
            }
        }

        if (tag) {
            switch (tag.propertyId) {
                case "categories": {
                    const id = getCategoryId(tag.tagId)
                    return {
                        url: `${domain}${LOAD_MANGA_BY_CATEGORY}?id=${id}&orderBy=${sort_id}&p=${page}`
                    }
                }
                case "authors": {
                    const id = getId(tag.tagId, '-')
                    return {
                        url: `${domain}${LOAD_MANGA_BY_AUTHOR}?id=${id}&orderBy=${sort_id}&p=${page}`
                    }
                }
                case "translator": {
                    const id = getId(tag.tagId, '-')
                    return {
                        url: `${domain}${LOAD_MANGA_BY_TRANSLATE_TEAM}?id=${id}&orderBy=${sort_id}&p=${page}`
                    }
                }
                case "uploader": {
                    const id = getId(tag.tagId, '/')
                    return {
                        url: `${domain.replace('//', '//id.')}${LOAD_MANGA_CREATED}?id=${id}&p=${page}`,
                        func: this.parser.getUploadMangas,
                    }
                }
            }
        }
        return {url: `${domain}${LOAD_LIST_MANGA}?key=tatca&orderBy=${sort_id}&p=${page}`}
    }

    // Content
    async getContent(contentId: string) {
        const domain = await GlobalStore.getDomain();
        const webUrl = contentId.includes(domain) ? contentId : domain + contentId;
        const $ = await this.fetchHTML(webUrl);
        return this.parser.getContent($, webUrl);
    }

    // Chapters
    async getChapters(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}${contentId}`)
        return this.parser.getChapters($);
    }

    async getChapterData(chapterId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}${chapterId}`)
        const chapterData = this.parser.getChapterData($);
        void this.preload(chapterData)
        return chapterData
    }

    async preload(chapterData: ChapterData) {
        const domain = await GlobalStore.getDomain()
        const pages = chapterData.pages || []
        for (const page of pages) {
            if (page.url != null) {
                void this.client.get(page.url, {headers: {Referer: domain + "/"}})
            }
        }
    }

    async getFilters(): Promise<DirectoryFilter[]> {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/timkiem/nangcao`)
        return this.parser.getFilters($);
    }


    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        try {
            console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
            const response = await this.client.get(url, config);
            return load(response.data);
        } catch (ex) {
            const err = <NetworkError>ex
            if (err?.res?.status == 404) {
                return load('')
            }
            console.error('Error occurred during JSON request:', err);
            throw ex;
        }
    }
}
