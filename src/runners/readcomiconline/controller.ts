import {
    ChapterData,
    DirectoryFilter,
    DirectoryRequest,
    NetworkRequestConfig,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {HOME_PAGE_SECTIONS, PREF_KEYS, READCOMICONLINE_URL} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {load} from "cheerio";
import {GlobalStore} from "./store";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser()
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const sections: PageSection[] = [];
        const [homepage, lastComics] = await Promise.all(
            [
                this.fetchHTML(READCOMICONLINE_URL),
                this.fetchHTML(`${READCOMICONLINE_URL}/ComicList/LatestUpdate`)
            ]
        )
        for (const section of HOME_PAGE_SECTIONS) {
            if (section.id == "latest") {
                const items = this.parser.getHomepageSection(lastComics, section.id)
                sections.push({...section, items})
            } else {
                const items = this.parser.getHomepageSection(homepage, section.id)
                sections.push({...section, items})
            }
        }
        return sections.filter(a => a.items?.length);
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const url = await this.createSearchURL(request)
        const $ = await this.fetchHTML(url)
        const results = this.parser.getSearchResults($)
        return {
            results,
            isLastPage: false
        };
    }

    async createSearchURL(request: DirectoryRequest): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {filters, query, tag, sort, page} = request;

        if (!filters && !query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "LatestUpdate"

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            const url = `${READCOMICONLINE_URL}/AdvanceSearch`
            const comicName = filters.name || ""
            const status = filters.status || ""
            const year = filters.year || ""
            const ig = filters.genre?.included.join("%2C")
            const eg = filters.genre?.excluded.join("%2C")
            return `${url}?comicName=${encodeURI(comicName)}&ig=${ig}&eg=${eg}&status=${status}&pubDate=${year}&page=${page}`
        }

        if (query) {
            return `${READCOMICONLINE_URL}/AdvanceSearch?comicName=${encodeURI(query.trim())}&page=${page}`
        }

        if (tag) {
            return `${READCOMICONLINE_URL}${tag.tagId}/${sort_id}?page=${page}`
        }

        return `${READCOMICONLINE_URL}/ComicList/${sort_id}?page=${page}`
    }

    // Content
    async getContent(contentId: string) {
        const webUrl = `${READCOMICONLINE_URL}${contentId}`
        const $ = await this.fetchHTML(webUrl)
        return this.parser.getContent($, webUrl);
    }

    // Chapters
    async getChapters(contentId: string) {
        const $ = await this.fetchHTML(`${READCOMICONLINE_URL}${contentId}`)
        return this.parser.getChapters($);
    }

    async getChapterData(chapterId: string) {
        const quality = await GlobalStore.getImageQuality()
        const $ = await this.fetchHTML(`${READCOMICONLINE_URL}${chapterId}&quality=${quality}`)
        const chapterData = await this.parser.getChapterData($)
        void this.preload(chapterData)
        return chapterData
    }

    async preload(chapterData: ChapterData) {
        const pages = chapterData.pages || []
        for (const page of pages) {
            if (page.url != null) {
                void this.client.get(page.url, {headers: {Referer: READCOMICONLINE_URL + "/"}})
            }
        }
    }

    async getFilters(): Promise<DirectoryFilter[]> {
        const $ = await this.fetchHTML(`${READCOMICONLINE_URL}/AdvanceSearch`)
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
            throw ex;
        }
    }
}
