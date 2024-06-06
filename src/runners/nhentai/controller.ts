import {
    ChapterData,
    Content,
    DirectoryFilter,
    DirectoryRequest,
    FilterType,
    Highlight,
    NetworkRequestConfig,
    Option,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {HOME_PAGE_SECTIONS, NHENTAI_DOMAIN, PREF_KEYS, SECTIONS} from "./constants";
import {Parser} from "./parser";
import {API} from "./api";
import {SearchGalleryRequest} from "./type";
import memoryCache, {CacheClass} from "memory-cache";
import {load} from "cheerio";
import {GlobalStore} from "./store";

export class Controller {
    private api = new API()
    private client = new NetworkClient()
    private cache: CacheClass<string, DirectoryRequest | Option[]> = new memoryCache.Cache();
    private parser = new Parser();


    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            const url = `${NHENTAI_DOMAIN}/search/?q=%22%22&sort=${section.id}`
            promises.push(
                this.fetchHTML(url).then(async ($) => {
                    const items = await this.parser.getGalleriesFromCheerio($)
                    sections.push({...section, items: items.slice(0, 20)})
                })
            )
        }
        await Promise.all(promises)
        const sectionIdInOrder = HOME_PAGE_SECTIONS.map((section) => {
            return section.id
        })
        sections.sort((a, b) => sectionIdInOrder.indexOf(a.id) - sectionIdInOrder.indexOf(b.id));
        sections.splice(0, 0, SECTIONS);
        return sections;

    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const results = await this.getGalleries(request)

        return {
            results: results,
            isLastPage: results.length == 0
        };
    }

    async getGalleries(request: DirectoryRequest): Promise<Highlight[]> {
        // eslint-disable-next-line prefer-const
        let {filters, query, tag, sort, page} = request

        const searchGalleryRequest: SearchGalleryRequest = {page: page}

        if (!filters && !query && !tag && sort && sort.id) {
            request = <DirectoryRequest>this.cache.get(PREF_KEYS.cache_request) ?? request
            tag = request.tag
            filters = request.filters
            query = request.query
        }

        if (sort && sort.id) {
            searchGalleryRequest.sort = sort.id
        }

        if (filters) {
            const tags = await this.getPopularTags()
            const tagsMap = new Map(tags.map(tag => [tag.id, tag.title]))
            let query = "";
            const includeTags = filters.tags?.included ?? [];
            const excludeTags = filters.tags?.excluded ?? [];
            for (const tag of includeTags) {
                query += ` tag:"${tagsMap.get(tag)}"`
            }
            for (const tag of excludeTags) {
                query += ` -tag:"${tagsMap.get(tag)}"`
            }
            searchGalleryRequest.query = query.trim()
        }

        if (query) {
            searchGalleryRequest.query = query.trim()
        }

        if (tag) {
            if (tag.propertyId == "section") {
                const url = `${NHENTAI_DOMAIN}/${tag.tagId}/popular?page=${page}`
                const $ = await this.api.fetchHTML(url)
                return this.parser.getTagAsHighLights($)
            }
            searchGalleryRequest.tagId = tag.tagId
        }

        const galleries = await this.api.searchGalleries(searchGalleryRequest)
        this.cache.put(PREF_KEYS.cache_request, request)
        return this.parser.getSearchResults(galleries)
    }

    async getFilters() {
        const filters: DirectoryFilter[] = []
        filters.push({
            id: "tags",
            title: "Tags",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: await this.getPopularTags()
        })
        return filters
    }

    // Content
    async getContent(contentId: string): Promise<Content> {
        const webUrl = `${NHENTAI_DOMAIN}/g/${contentId}`

        const [gallery, similarGalleries] = await Promise.all([
            this.api.getGallery(contentId),
            this.api.getSimilarGalleries(contentId)
        ]);
        return this.parser.getContent(gallery, similarGalleries, webUrl);
    }

    async getChapterData(contentId: string) {
        const gallery = await this.api.getGallery(contentId)
        const chapterData = this.parser.getChapterData(gallery);
        void this.preload(chapterData);
        return chapterData;
    }

    async preload(chapterData: ChapterData) {
        const pages = chapterData.pages || []
        for (const page of pages) {
            if (page.url != null) {
                void this.client.get(page.url, {headers: {Referer: NHENTAI_DOMAIN + "/"}})
            }
        }
    }


    async getPopularTags(): Promise<Option[]> {
        const numPages = await GlobalStore.getNumPages()
        const cacheKey = PREF_KEYS.cache_tags + numPages
        const cachedTags = <Option[]>this.cache.get(cacheKey);
        if (cachedTags) {
            return cachedTags;
        }
        let popularTags: Option[] = [];
        const pagePromises = [];
        for (let i = 1; i <= numPages; i++) {
            pagePromises.push(this.fetchHTML(`${NHENTAI_DOMAIN}/tags/popular?page=${i}`));
        }
        const pages = await Promise.all(pagePromises);
        pages.forEach(page => {
            popularTags.push(...this.parser.getTags(page));
        });
        popularTags = popularTags.sort((a, b) => a.title.localeCompare(b.title));
        this.cache.put(cacheKey, popularTags);
        return popularTags;
    }

    async getPopularTagsToExclude(): Promise<Option[]> {
        const numPages = await GlobalStore.getNumPagesToExclude()
        const cacheKey = PREF_KEYS.cache_tags + numPages
        const cachedTags = <Option[]>this.cache.get(cacheKey);
        if (cachedTags) {
            return cachedTags;
        }
        let popularTags: Option[] = [];
        const pagePromises = [];
        for (let i = 1; i <= numPages; i++) {
            pagePromises.push(this.fetchHTML(`${NHENTAI_DOMAIN}/tags/popular?page=${i}`));
        }
        const pages = await Promise.all(pagePromises);
        pages.forEach(page => {
            popularTags.push(...this.parser.getTags(page));
        });
        popularTags = popularTags.sort((a, b) => a.title.localeCompare(b.title));
        this.cache.put(cacheKey, popularTags);
        return popularTags;
    }

    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }
}
