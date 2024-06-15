import {Content, DirectoryRequest, NetworkRequestConfig, Option, PagedResult, PageSection,} from "@suwatte/daisuke";
import {HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import {load} from "cheerio";

import memoryCache, {CacheClass} from 'memory-cache';

import {GlobalStore} from "./store";

export class Controller {
    private client = new NetworkClient();
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const sections: PageSection[] = [];
        const $ = await this.fetchHTML(domain)
        for (const section of HOME_PAGE_SECTIONS) {
            const items = await this.parser.getHomepageSection($, section.id)
            sections.push({...section, items})
        }
        return sections.filter(a => a.items?.length);
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const domain = await GlobalStore.getDomain()
        const url = await this.createSearchURL(request, domain)
        const $ = await this.fetchHTML(url)
        const results = this.parser.getSearchResults($, true)
        return {
            results,
            isLastPage: false
        };
    }

    async getCategories(): Promise<Option[]> {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/genre`)
        return this.parser.getCategories($);
    }

    async createSearchURL(request: DirectoryRequest, domain: string): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {listId, query, tag, sort, page} = request;

        if (listId) {
            return `${domain}/${listId}?page=${page}`
        }
        if (!query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            query = request.query
            tag = request.tag
        }


        const sort_id = sort?.id || "latest"

        if (!query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (query) {
            return `${domain}/search?s=${encodeURI(query.trim())}&page=${page}`
        }

        if (tag) {
            return `${tag.tagId}?m_orderby=${sort_id}&page=${page}`
        }

        return `${domain}/?page=${page}`
    }

    // Content
    async getContent(contentId: string): Promise<Content> {
        const $ = await this.fetchHTML(contentId)
        return this.parser.getContent($, contentId)
    }

    async getChapterData(_: string, chapterId: string) {
        const $ = await this.fetchHTML(chapterId)
        return this.parser.getChapterData($);
    }

    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }
}
