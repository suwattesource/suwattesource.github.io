import {
    ChapterData,
    DirectoryFilter,
    DirectoryRequest,
    NetworkRequestConfig,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {load} from "cheerio";
import {ALLPORNCOMIC_DOMAIN, HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import memoryCache, {CacheClass} from "memory-cache";
import {SearchConfig} from "./type";

export class Controller {
    private client = new NetworkClient()
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            promises.push(
                this.fetchHTML(`${ALLPORNCOMIC_DOMAIN}/porncomic/?m_orderby=${section.id}`).then(async ($) => {
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
        const searchConfig = await this.createSearchConfig(request)
        const $ = await this.fetchHTML(searchConfig.url)
        let parseFunction = this.parser.getSearchResults
        if (searchConfig.func) {
            parseFunction = searchConfig.func.bind(this.parser)
        }
        const results = parseFunction($)

        return {
            results,
            isLastPage: false,
        };
    }


    async createSearchConfig(request: DirectoryRequest): Promise<SearchConfig> {
        // eslint-disable-next-line prefer-const
        let {filters, query, tag, sort, page} = request;

        if (!filters && !query && !tag && sort?.id) {
            request = <DirectoryRequest>this.cache.get(PREF_KEYS.request) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "latest"

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            const search = {
                genres: "",
                op: "",
                author: "",
                artist: "",
                release: "",
                status: "",
            };

            const title = filters.title ?? "";
            const includeGenres = (filters.genres ?? []).map((url: string) => {
                const parts = url.split('/');
                return parts[parts.length - 2] || "";
            });
            const includeStatus = filters.status ?? []
            search.genres = includeGenres.map((genre: any) => `genre%5B%5D=${encodeURIComponent(genre)}`).join("&");
            search.status = includeStatus.map((status: any) => `status%5B%5D=${encodeURIComponent(status)}`).join("&");
            search.op = filters.hot ? "1" : "";
            search.author = filters.author ?? "";
            search.artist = filters.artist ?? "";
            search.release = filters.release ?? "";

            const params = `${search.genres}&op=${search.op}&author=${search.author}&artist=${search.artist}&release=${search.release}&${search.status}&m_orderby=${sort_id}`;

            return {
                url: `${ALLPORNCOMIC_DOMAIN}/page/${page}/?s=${encodeURI(title)}&post_type=wp-manga&${params}`,
                func: this.parser.getAdvancedSearchResults
            }
        }

        if (query) {
            return {
                url: `${ALLPORNCOMIC_DOMAIN}/page/${page}/?s=${encodeURI(query)}&post_type=wp-manga`,
                func: this.parser.getAdvancedSearchResults
            }
        }
        if (tag) {
            return {url: `${tag.tagId}page/${page}/?m_orderby=${sort_id}`}
        }
        return {url: `${ALLPORNCOMIC_DOMAIN}/porncomic/page/${page}/?m_orderby=${sort_id}`}
    }

    // Content
    async getContent(contentId: string) {
        const $ = await this.fetchHTML(contentId)
        return this.parser.getContent($, contentId);
    }

    async getChapters(_: string) {
        return []
    }

    async getChapterData(chapterId: string): Promise<ChapterData> {
        const $ = await this.fetchHTML(chapterId)
        const chapterData = this.parser.getChapterData($)
        void this.preload(chapterData)
        return chapterData
    }

    async getFilters(): Promise<DirectoryFilter[]> {
        const $ = await this.fetchHTML(`${ALLPORNCOMIC_DOMAIN}/genres/`)
        return this.parser.getFilters($);
    }


    async preload(chapterData: ChapterData) {
        const pages = chapterData.pages || []

        for (const page of pages) {
            if (page.url != null) {
                void this.client.get(page.url, {headers: {Referer: ALLPORNCOMIC_DOMAIN + "/"}})
            }
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
