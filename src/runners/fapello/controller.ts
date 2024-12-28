import {ChapterData, DirectoryRequest, NetworkRequestConfig, PagedResult, PageSection} from "@suwatte/daisuke";
import {load} from "cheerio";
import {FAPELLO_DOMAIN, HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            promises.push(
                this.fetchHTML(`${FAPELLO_DOMAIN}/ajax/${section.id}/page-1/`).then(async ($) => {
                    const items = this.parser.getSearchResults($)
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
        const url = await this.createSearchURL(request, FAPELLO_DOMAIN)
        const $ = await this.fetchHTML(url)
        const results = this.parser.getSearchResults($)
        return {
            results,
            isLastPage: false
        };
    }

    async createSearchURL(request: DirectoryRequest, domain: string): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {query, tag, sort, page} = request;

        if (!query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            query = request.query
            tag = request.tag
        }


        const sort_id = sort?.id || "0"

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
        const webUrl = `${FAPELLO_DOMAIN}/${contentId}/`
        const $ = await this.fetchHTML(webUrl)
        return this.parser.getContent($, webUrl);
    }

    async getChapters(_: string) {
        return []
    }

    async getChapterData(contentId: string, chapterId: string) {
        let chapterData = <ChapterData>this.cache.get(PREF_KEYS.cache_chapter_images)
        if (!chapterData) {
            const $ = await this.fetchHTML(`${FAPELLO_DOMAIN}/${contentId}/`)
            chapterData = this.parser.getChapterData($, contentId)
        }

        const totalImages = chapterData.pages?.filter(v => v).map(v => String(v.url)) || []
        const numberOfImages = await GlobalStore.getNumImages()
        if (numberOfImages == 0) {
            void this.preload(totalImages)
            return chapterData
        }
        const getChapterImages = (images: string[], k: number, i: number) => images.slice(i * k, (i + 1) * k);
        const images = getChapterImages(totalImages, numberOfImages, Number(chapterId) - 1);
        void this.preload(images)
        chapterData = {
            pages: images.map(v => ({url: v}))
        }
        return chapterData
    }

    async preload(images: string[]) {
        for (const image of images) {
            void this.client.get(image, {headers: {Referer: FAPELLO_DOMAIN + "/"}})
        }
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
