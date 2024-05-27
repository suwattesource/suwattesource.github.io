import {
    DirectoryRequest,
    Highlight,
    NetworkClientBuilder,
    NetworkRequestConfig,
    PagedResult,
    PageSection
} from "@suwatte/daisuke";
import {load} from "cheerio";
import {
    AUTH_COOKIE,
    CHAPTER_LOADED,
    CHECK_AUTH,
    FOLLOW,
    GET_FOLLOW_TOKEN,
    GET_FOLLOWED_COMICS,
    GET_READ_COMICS,
    HOME_PAGE_SECTIONS,
    NETTRUYEN_SEARCH_SUGGESTION_URL,
    PREF_KEYS,
    READ
} from "./constants";
import {Parser} from "./parser";
import {AuthInterceptor, getAPIUrl} from "./utils";
import memoryCache, {CacheClass} from "memory-cache";
import {GlobalStore} from "./store";
import {isNumber} from "../../utils/utils";

export class Controller {
    private client = new NetworkClientBuilder()
        .addRequestInterceptor(AuthInterceptor)
        .build();
    private parser = new Parser();
    private cache: CacheClass<string, DirectoryRequest> = new memoryCache.Cache();

    async buildHomePageSections() {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(domain)
        const sections: PageSection[] = [];
        for (const section of HOME_PAGE_SECTIONS) {
            const items = this.parser.getHomepageSection($, section.id);
            sections.push({...section, items});
        }
        return sections;
    }

    async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
        let results: Highlight[]
        let isLastPage: boolean
        const domain = await GlobalStore.getDomain()
        const searchUrl = await this.createSearchURL(request, domain)
        if (searchUrl.includes("Comic/Services")) {
            const $ = await this.fetchHTML(searchUrl, true)
            results = this.parser.getPersonalList($)
            isLastPage = results.length < 36;

        } else {
            const $ = await this.fetchHTML(searchUrl, false)
            results = this.parser.getSearchResults($);
            isLastPage = this.parser.isLastPage($)
        }
        return {
            results,
            isLastPage: isLastPage
        };
    }

    async getFilters() {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/tim-truyen-nang-cao`)
        return this.parser.getFilters($);
    }

    async createSearchURL(request: DirectoryRequest, domain: string): Promise<string> {
        // eslint-disable-next-line prefer-const
        let {filters, listId, query, tag, sort, page} = request;

        if (!filters && !query && !tag && sort?.id) {
            request = this.cache.get(PREF_KEYS.request) ?? request
            filters = request.filters
            query = request.query
            tag = request.tag
        }

        const sort_id = sort?.id || "0"

        if (!filters && !query && !tag) {
            this.cache.del(PREF_KEYS.request)
        }
        if (filters || query || tag) {
            this.cache.put(PREF_KEYS.request, request)
        }

        if (filters) {
            const search = {
                genres: '',
                exgenres: '',
                gender: "-1",
                status: "-1",
                minchapter: "1",
            };

            const includeGenres = filters.genres?.included ?? [];
            const excludeGenres = filters.genres?.excluded ?? [];

            search.genres = includeGenres.join(",");
            search.exgenres = excludeGenres.join(",");
            search.minchapter = filters.minchapter ?? "1"
            search.gender = filters.gender ?? "-1"
            search.status = filters.status ?? "-1"

            const paramExgenres = search.exgenres ? `&notgenres=${search.exgenres}` : '';

            const url = `${domain}/tim-truyen-nang-cao`;
            const param = `?genres=${search.genres}${paramExgenres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${sort_id}&page=${page}`;
            return url + param
        }

        if (listId) {
            let url: string
            const token = await SecureStore.string("token") || ""
            const userID = await SecureStore.string("user_id") || ""
            if (listId === "followed") {
                url = `${await getAPIUrl(GET_FOLLOWED_COMICS)}?userGuid=${userID}&token=${encodeURI(token)}&loadType=0`
            } else {
                url = `${await getAPIUrl(GET_READ_COMICS)}?token=${encodeURI(token)}`
            }
            return `${url}&page=${page}`
        }

        if (query) {
            return `${domain}/tim-truyen${encodeURI(`?keyword=${query.trim()}&page=${page}`)}`
        }

        if (tag) {
            switch (tag.propertyId) {
                case "genres": {
                    if (isNumber(tag.tagId)) {
                        return `${domain}/tim-truyen-nang-cao?genres=${tag.tagId}&sort=${sort_id}&page=${page}`;
                    }
                    if (domain.includes("nhattruyen")) {
                        return `${domain}/the-loai/${tag.tagId}?sort=${sort_id}&page=${page}`
                    }
                    return `${domain}/tim-truyen/${tag.tagId}?sort=${sort_id}&page=${page}`
                }
                case "authors": {
                    return `${domain}/tim-truyen?${tag.tagId}&page=${page}`
                }
                case "minchapter": {
                    return `${domain}/tim-truyen-nang-cao?minchapter=${tag.tagId}&sort=${sort_id}&page=${page}`
                }
                case "status": {
                    return `${domain}/tim-truyen-nang-cao?status=${tag.tagId}&sort=${sort_id}&page=${page}`
                }
                case "gender": {
                    return `${domain}/tim-truyen-nang-cao?gender=${tag.tagId}&sort=${sort_id}&page=${page}`
                }
            }
        }

        return `${domain}/tim-truyen?sort=${sort_id}&page=${page}`
    }

    // Content
    async getContent(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/truyen-tranh/${contentId}`);
        return this.parser.getContent($, contentId);
    }

    // Chapters
    async getChapters(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/truyen-tranh/${contentId}`)
        return this.parser.getChapters($);
    }

    async getChapterData(chapterId: string) {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/truyen-tranh/${chapterId}`)
        return this.parser.getChapterData($);
    }

    async handleAuth(password: string) {
        const config: NetworkRequestConfig = {
            cookies: [
                {
                    name: AUTH_COOKIE,
                    value: password,
                }
            ]
        }
        const checkAuthApiUrl = await getAPIUrl(CHECK_AUTH)
        const resp = await this.client.post(checkAuthApiUrl, config)
        const json = JSON.parse(resp.data)
        await SecureStore.set("auth_cookie", password);
        await SecureStore.set("token", json.token);
        await SecureStore.set("user_id", json.userGuid)
        await SecureStore.set("user_name", json.fullName);
        await SecureStore.set("avatar", "https:" + json.avatar);
    }

    async syncToNetTruyen(contentId: string, chapterId: string): Promise<void> {
        chapterId = chapterId.split("/").pop() || ""
        const comicToken = await ObjectStore.get(PREF_KEYS.comicToken)
        const chapterLoadedApiUrl = `${await getAPIUrl(CHAPTER_LOADED)}?chapterId=${chapterId}&comicToken=${comicToken}&userToken=`
        const resp = await this.client.get(chapterLoadedApiUrl)
        console.log(chapterLoadedApiUrl)
        const loaded = JSON.parse(resp.data)
        console.log(loaded)
        const readApiUrl = `${await getAPIUrl(READ)}?chapterId=${chapterId}&token=${loaded.token}`
        await this.client.get(readApiUrl)
    }

    async followManga(_: string): Promise<void> {
        const comicId = await ObjectStore.get(PREF_KEYS.comicId)
        const comicToken = await ObjectStore.get(PREF_KEYS.comicToken)
        const getFollowTokenApiUrl = `${await getAPIUrl(GET_FOLLOW_TOKEN)}?comicId=${comicId}&token=${comicToken}`
        console.log(getFollowTokenApiUrl)
        let resp = await this.client.get(getFollowTokenApiUrl)
        const data = JSON.parse(resp.data)
        console.log(data)
        const followApiUrl = `${await getAPIUrl(FOLLOW)}?comicId=${comicId}&token=${data.data}`
        resp = await this.client.get(followApiUrl)
        console.log(JSON.parse(resp.data))
    }

    private async fetchHTML(url: string, isPersonalList?: boolean, config?: NetworkRequestConfig) {
        if (isPersonalList) {
            return this.getPersonalListHTML(url, config)
        }
        try {
            if (url.includes("keyword") && url.includes("page=1")) {
                const keyword = url.substring(url.indexOf("keyword"), url.indexOf("&")).slice(8)
                console.log(`Searching titles with the keyword: ${keyword}, url: ${url}`)
                const [suggestions, response] = await Promise.all([
                    this.client.get(`${NETTRUYEN_SEARCH_SUGGESTION_URL}?q=${keyword}`),
                    this.client.get(url, config)
                ]);
                if (!suggestions.data.trim()) {
                    return load(suggestions.data)
                }
                return load(response.data)
            }
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

    private async getPersonalListHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        const json = JSON.parse(response.data)
        return load(json.listHtml ?? json.followedListHtml);
    }
}
