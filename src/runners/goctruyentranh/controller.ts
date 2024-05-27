import {DirectoryRequest, NetworkRequestConfig, PagedResult, PageSection} from "@suwatte/daisuke";
import {load} from "cheerio";
import {HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {API} from "./api";
import {SearchGalleryRequest} from "./type";

export class Controller {
    private api = new API()
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();


    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            promises.push(this.api.getHomeGalleryList(
                    {
                        p: 0,
                        value: section.id,
                    }
                ).then(async (galleries) => {
                    const items = this.parser.getSearchResults(galleries)
                    sections.push({...section, items})
                })
            )
        }
        await Promise.all(promises)
        const sectionIdInOrder = HOME_PAGE_SECTIONS.map((section) => {
            return section.id
        })
        sections.sort((a, b) => sectionIdInOrder.indexOf(a.id) - sectionIdInOrder.indexOf(b.id));
        return sections.filter(a => a.items?.length);
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const searchRequest = await this.createSearchRequest(request)
        const galleries = await this.api.searchGalleries(searchRequest)
        const results = this.parser.getSearchResults(galleries, true)
        return {
            results,
            isLastPage: false
        };
    }

    async createSearchRequest(request: DirectoryRequest): Promise<SearchGalleryRequest> {
        // eslint-disable-next-line prefer-const
        let {filters, query, tag, sort, page} = request;

        if (!filters && !query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "recentDate"

        const searchRequest: SearchGalleryRequest = {
            p: page - 1,
            orders: [sort_id]
        }

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            searchRequest.searchValue = filters.keyword
            searchRequest.categories = filters.category ?? []
            searchRequest.status = filters.status ?? []
        }

        if (query) {
            searchRequest.searchValue = encodeURI(query.trim())
        }

        if (tag) {
            searchRequest.categories = [tag.tagId]
        }

        return searchRequest
    }

    // Content
    async getContent(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const gallery = this.api.getGalleryInfo(contentId)
        const webUrl = `${domain}/truyen/${gallery?.nameEn}`
        const chapterInfos = await this.api.getChapterList(contentId)
        return this.parser.getContent(gallery, chapterInfos, webUrl);
    }

    // Chapters
    async getChapters(contentId: string) {
        const chapterInfos = await this.api.getChapterList(contentId)
        return this.parser.getChapters(chapterInfos);
    }

    async getChapterData(comicId: string, chapterId: string) {
        const urls = await this.api.getChapterImages(comicId, chapterId)
        return this.parser.getChapterData(urls)
    }

    async getFilters() {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/danh-sach`)
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
