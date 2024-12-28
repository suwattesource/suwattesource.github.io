import {DirectoryRequest, PagedResult, PageSection} from "@suwatte/daisuke";
import {HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {API} from "./api";
import {SearchGalleryRequest} from "./type";

export class Controller {
    private api = new API()
    private client = new NetworkClient();
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
                    const items = await this.parser.getSearchResults(galleries)
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
        const results = await this.parser.getSearchResults(galleries, true)
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
            searchRequest.categories = filters.categories ?? []
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
        return this.parser.getContent(domain, gallery, chapterInfos, webUrl);
    }

    // Chapters
    async getChapters(contentId: string) {
        const chapterInfos = await this.api.getChapterList(contentId)
        return this.parser.getChapters(chapterInfos);
    }

    async getChapterData(comicId: string, chapterId: string) {
        const urls = await this.api.getChapterImages(comicId, chapterId)
        void this.preload(urls)
        return this.parser.getChapterData(urls)
    }

    async preload(chapterImages: string[]) {
        const domain = await GlobalStore.getDomain()
        for (const url of chapterImages) {
            void this.client.get(url, {headers: {Referer: domain + "/"}})
        }
    }

    async getFilters() {
        const categories = await this.api.getCategories()
        return this.parser.getFilters(categories);
    }
}
