import {ChapterData, DirectoryRequest, NetworkRequestConfig, PagedResult, PageSection} from "@suwatte/daisuke";
import {load} from "cheerio";
import {HOME_PAGE_SECTIONS, IMAGE_LIST, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {SearchConfig} from "./type";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, string | DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const sections: PageSection[] = [];

        const $ = await this.fetchHTML(domain)
        for (const section of HOME_PAGE_SECTIONS) {
            const items = this.parser.getHomepageSection($, domain, section.id)
            sections.push({...section, items})
        }
        return sections.filter(a => a.items?.length);
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const domain = await GlobalStore.getDomain()
        const searchConfig = await this.createSearchConfig(request, domain)
        const $ = await this.fetchHTML(searchConfig.url)
        let parseFunction = this.parser.getNewUpdateMangas
        if (searchConfig.func) {
            parseFunction = searchConfig.func.bind(this.parser)
        }
        const results = parseFunction($, domain)

        return {
            results,
            isLastPage: false
        };
    }

    async createSearchConfig(request: DirectoryRequest, domain: string): Promise<SearchConfig> {
        // eslint-disable-next-line prefer-const
        let {query, tag, sort, page} = request;

        if (!query && !tag && sort?.id) {
            request = <DirectoryRequest>this.cache.get(PREF_KEYS.request) ?? request
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "latest-updated"

        if (!query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (query) {
            return {
                url: `${domain}/search/${page}/?keyword=${encodeURI(query.trim())}`
            }
        }

        if (tag) {
            tag.tagId
            return {
                url: `${tag.tagId}/${page}/?sort=${sort_id}`
            }

        }
        return {url: `${domain}/tat-ca-truyen/${page}`}
    }

    // Content
    async getContent(contentId: string) {
        const webUrl = contentId
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
        chapterId = chapterId.split('/').pop() || ""
        const domain = await GlobalStore.getDomain()
        const url = domain + IMAGE_LIST.replace('{chapterID}', chapterId)
        const response = await this.client.get(url);
        const $ = load(JSON.parse(response.data).html as string)
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

    async getTags() {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(domain)
        return this.parser.getTags($)
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
