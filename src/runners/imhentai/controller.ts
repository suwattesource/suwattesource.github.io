import {
    Content,
    DirectoryRequest,
    FilterType,
    NetworkRequestConfig,
    Option,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {FILTERS, HOME_PAGE_SECTIONS, IMHENTAI_DOMAIN, PREF_KEYS, SECTIONS} from "./constants";
import {Parser} from "./parser";
import {load} from "cheerio";

import memoryCache, {CacheClass} from 'memory-cache';
import {startCase} from "./utils";
import {GlobalStore} from "./store";
import {SearchConfig} from "./type";

export class Controller {
    private client = new NetworkClient();
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest | Option[]> = new memoryCache.Cache();


    async buildHomePageSections() {
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        for (const section of HOME_PAGE_SECTIONS) {
            promises.push(
                this.fetchHTML(`${IMHENTAI_DOMAIN}/category/${section.id}`).then(async ($) => {
                    const items = await this.parser.getSearchResults($)
                    sections.push({...section, items})
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
        const searchConfig = await this.createSearchURL(request);
        const $ = await this.fetchHTML(searchConfig.url)
        const parseFunction = searchConfig.func.bind(this.parser)
        const results = await parseFunction($)
        return {
            results,
            isLastPage: this.parser.isLastPage($)
        };
    }

    async createSearchURL(request: DirectoryRequest): Promise<SearchConfig> {
        const searchOptions = {
            lt: 0,      // latest
            pp: 0,      // popular
            dl: 0,      // downladed
            tr: 0,      // top rated
            en: 1,      // english
            jp: 1,      // japanese
            es: 1,      // spanish
            fr: 1,      // french
            kr: 1,      // korean
            de: 1,      // german
            ru: 1,      // russian
            m: 1,       // manga
            d: 1,       // doujinshi
            w: 1,       // western
            i: 1,       // image set
            a: 1,       // artist cg
            g: 1,       // game cg
        };

        let keyword = ""
        let baseUrl = `${IMHENTAI_DOMAIN}/search`
        const cacheKey = PREF_KEYS.cache_request

        // eslint-disable-next-line prefer-const
        let {filters, query, tag, sort, page} = request


        if (!filters && !query && !tag && sort && sort.id) {
            request = <DirectoryRequest>this.cache.get(cacheKey) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        if (sort && sort.id) {
            searchOptions[sort.id as keyof typeof searchOptions] = 1
        }

        this.cache.put(cacheKey, request)

        if (filters) {
            baseUrl = `${IMHENTAI_DOMAIN}/advsearch`
            const tags = await this.getPopularTags()
            const tagsMap = new Map(tags.map(tag => [tag.id, tag.title]))
            const categories = filters.category ?? []
            const languages = filters.language ?? []
            const includeTags = filters.tags?.included ?? [];
            const excludeTags = filters.tags?.excluded ?? [];

            for (const category of categories) {
                searchOptions[category as keyof typeof searchOptions] = 0
            }
            for (const language of languages) {
                searchOptions[language as keyof typeof searchOptions] = 0
            }
            for (const tag of includeTags) {
                keyword += ` +tag:"${startCase(tagsMap.get(tag))}"`
            }
            for (const tag of excludeTags) {
                keyword += ` -tag:"${startCase(tagsMap.get(tag))}"`
            }
            keyword = keyword.trim()
        }

        if (query) {
            keyword = query
        }

        if (tag) {
            if (tag.propertyId == "section") {
                return {
                    url: `${IMHENTAI_DOMAIN}/${tag.tagId}/popular?page=${page}`,
                    func: this.parser.getTagAsHighLights
                }
            }
            baseUrl = `${IMHENTAI_DOMAIN}${tag.tagId}`
            if (sort && sort.id == "pp") {
                baseUrl += "popular/"
            }
            return {
                url: `${baseUrl}?page=${page}`,
                func: this.parser.getSearchResults
            };
        }

        keyword = encodeURIComponent(keyword)
        const param = `apply=Search&${Object.entries(searchOptions).map(([key, value]) => `${key}=${value}`).join('&')}`;
        return {
            url: `${baseUrl}/?key=${keyword}&${param}&page=${page}`,
            func: this.parser.getSearchResults
        };
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
            pagePromises.push(this.fetchHTML(`${IMHENTAI_DOMAIN}/tags/popular/?page=${i}`));
        }
        const pages = await Promise.all(pagePromises);
        pages.forEach(page => {
            popularTags.push(...this.parser.getTags(page));
        });
        popularTags = popularTags.sort((a, b) => a.title.localeCompare(b.title));
        this.cache.put(cacheKey, popularTags);
        return popularTags;
    }

    async getFilters() {
        const filters = FILTERS
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
        const webUrl = `${IMHENTAI_DOMAIN}/gallery/${contentId}`
        const $ = await this.fetchHTML(webUrl)
        return this.parser.getContent($, webUrl);
    }

    async getChapterData(contentId: string) {
        const $ = await this.fetchHTML(`${IMHENTAI_DOMAIN}/view/${contentId}/1`);
        return this.parser.getChapterData($);
    }


    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }
}
