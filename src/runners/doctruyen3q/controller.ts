import {DirectoryRequest, NetworkRequestConfig, PagedResult, PageSection} from "@suwatte/daisuke";
import {load} from "cheerio";
import {HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const sections: PageSection[] = [];
        const $ = await this.fetchHTML(domain)
        for (const section of HOME_PAGE_SECTIONS) {
            const items = this.parser.getHomepageSection($, section.id)
            sections.push({...section, items})
        }
        return sections.filter(a => a.items?.length);
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const domain = await GlobalStore.getDomain()
        const url = await this.createSearchURL(request, domain)
        const $ = await this.fetchHTML(url)
        const results = this.parser.getSearchResults($)
        return {
            results,
            isLastPage: false
        };
    }

    async createSearchURL(request: DirectoryRequest, domain: string): Promise<string> {
        let {query, tag, sort, page} = request;

        if (!query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            query = request.query
            tag = request.tag
        }


        let sort_id = sort?.id || "0"

        if (!query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (query) {
            return `${domain}/tim-truyen${encodeURI(`?keyword=${query.trim()}&page=${page}`)}`
        }

        if (tag) {
            return `${tag.tagId}?sort=${sort_id}&page=${page}`
        }

        return `${domain}/tim-truyen?sort=${sort_id}&page=${page}`
    }

    // Content
    async getContent(contentId: string) {
        const content = await this.fetchHTML(contentId)
        return this.parser.getContent(content, contentId);
    }

    // Chapters
    async getChapters(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}${contentId}`)
        return this.parser.getChapters($);
    }

    async getChapterData(chapterId: string) {
        const $ = await this.fetchHTML(chapterId)
        return this.parser.getChapterData($);
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
