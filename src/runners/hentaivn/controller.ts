import {
    Content,
    DirectoryFilter,
    DirectoryRequest,
    NetworkRequestConfig,
    Option,
    PagedResult,
    PageSection,
} from "@suwatte/daisuke";
import {HOME_PAGE_SECTIONS, PREF_KEYS,} from "./constants";
import {Parser} from "./parser";
import {load} from "cheerio";

import memoryCache, {CacheClass} from 'memory-cache';

import {GlobalStore} from "./store";
import {SearchConfig} from "./type";


export class Controller {
    private client = new NetworkClient();
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const promises: Promise<void>[] = []
        const sections: PageSection[] = [];

        let defaultCheerio = load("")
        for (const section of HOME_PAGE_SECTIONS) {
            let url: string;
            switch (section.id) {
                case 'trending':
                case 'hot':
                case 'new_update':
                case 'top_liked_daily':
                    url = domain;
                    break;
                case 'recommend':
                    url = domain + '/top-de-cu.html';
                    break;
                case 'top_liked_all':
                    url = domain + "/top-luot-xem.html";
                    break;
                case 'new_upload':
                    url = domain + "/list-new2.php";
                    break;
                case 'random_suggestion':
                    url = domain + "/list-random.php";
                    break;
                default:
                    throw new Error("Invalid homepage section ID");
            }
            if ((section.id == "trending") || (url != domain)) {
                promises.push(
                    this.fetchHTML(url).then(async ($) => {
                        if (url == domain) {
                            defaultCheerio = $
                        }
                        const items = await this.parser.getHomepageSection($, section.id)
                        sections.push({...section, items})
                    })
                );
            }

        }
        await Promise.all(promises)
        for (const section of HOME_PAGE_SECTIONS) {
            if (['hot', 'new_update', 'top_liked_daily'].includes(section.id)) {
                const items = await this.parser.getHomepageSection(defaultCheerio, section.id)
                sections.push({...section, items})
            }
        }
        const sectionIdInOrder = HOME_PAGE_SECTIONS.map((section) => {
            return section.id
        })
        sections.sort((a, b) => sectionIdInOrder.indexOf(a.id) - sectionIdInOrder.indexOf(b.id));
        return sections;
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        const searchConfig = await this.createSearchConfig(request)
        const $ = await this.fetchHTML(searchConfig.url, {cookies: searchConfig.cookies})
        const parseFunction = searchConfig.func.bind(this.parser)
        const results = await parseFunction($)

        return {
            results,
            isLastPage: this.parser.isLastPage($)
        };
    }

    async getCategories(): Promise<Option[]> {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/tag_box.php`)
        return this.parser.getCategories($);
    }

    async getFilters(): Promise<DirectoryFilter[]> {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/forum/search-plus.php`)
        return this.parser.getFilters($);
    }

    async createSearchConfig(request: DirectoryRequest): Promise<SearchConfig> {
        const cookie = {
            "view0": 1,
            "view": 0,
            "view2": 0,
            "view3": 0,
            "view4": 0,
            "view5": 0
        }

        const domain = await GlobalStore.getDomain()
        const cacheKey = PREF_KEYS.cache_request

        // eslint-disable-next-line prefer-const
        let {configID, filters, query, tag, sort, page} = request

        if (configID) {
            if (configID == "new_update") {
                return {
                    url: `${domain}/?page=${page}`,
                    func: this.parser.getNewUpdateMangas
                }
            }
            return {
                url: `${domain}/${configID}?page=${page}`,
                func: this.parser.getMangasWithLikes
            }
        }

        if (!filters && !query && !tag && sort && sort.id != "") {
            request = this.cache.get(cacheKey) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        if (sort && sort.id) {
            cookie.view0 = 0
            cookie[sort.id as keyof typeof cookie] = 1
        }

        const cookies = Object.entries(cookie).map(([name, value]) => ({name, value: value.toString()}))


        if (!filters && !query && !tag) {
            this.cache.del(cacheKey)
        }
        if (filters || query || tag) {
            this.cache.put(cacheKey, request)
        }

        if (filters) {
            const manga_name = encodeURI(filters.manga_name ?? "")
            const doujinshi = encodeURI(filters.doujinshi ?? "")
            const character = encodeURI(filters.character ?? "")
            const categories = filters.categories ?? []
            const catQuery = categories.map((value: string) => `tag%5B%5D=${encodeURIComponent(value)}`).join('&')
            return {
                url: `${domain}/forum/search-plus.php?name=${manga_name}&dou=${doujinshi}&char=${character}&${catQuery}&search&page=${page}`,
                func: this.parser.getSearchResults,
            }

        }

        if (query) {
            return {
                url: `${domain}/tim-kiem-truyen.html?key=${encodeURI(query)}&page=${page}`,
                cookies: cookies,
                func: this.parser.getMangasWithLikes
            }
        }

        if (tag) {
            if (tag.propertyId == "uploader") {
                return {
                    url: `${domain}${encodeURI(tag.tagId)}?page=${page}`,
                    cookies: cookies,
                    func: this.parser.getUploadMangas
                }
            }
            return {
                url: `${domain}${encodeURI(tag.tagId)}?page=${page}`,
                cookies: cookies,
                func: this.parser.getMangasWithLikes
            }
        }

        return {url: `${domain}/danh-sach.html?page=${page}`, cookies: cookies, func: this.parser.getMangasWithLikes};
    }

    // Content
    async getContent(contentId: string): Promise<Content> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain}/${encodeURI(contentId)}`
        const $ = await this.fetchHTML(url)
        return this.parser.getContent($, url)
    }

    async getChapterData(_: string, chapterId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/${chapterId}`)
        return this.parser.getChapterData($);
    }

    private async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }
}
