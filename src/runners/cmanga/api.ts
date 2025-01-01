import {NetworkClientBuilder, NetworkRequest, NetworkRequestConfig} from "@suwatte/daisuke";
import {
    API_ALBUM_SUGGEST,
    API_CHAPTER_IMAGE,
    API_CHAPTER_LIST,
    API_GET_TAGS,
    API_GET_USER_DATA,
    API_GET_USER_LIST,
    API_HOME_ALBUM_LIST,
    API_HOME_ALBUM_TOP,
    API_LOGIN,
    API_SEARCH,
    API_USER_OPERATION,
    Avatar,
    BATCH_SIZE_GET_CHAPTER_LIST,
    CookieNamePassword,
    CookieNameSession,
    UserId,
    UserName
} from "./constants";
import {CheerioAPI, load} from "cheerio";
import {AuthInterceptor, getCookieValue, parseChapterImages, parseChapters, parseGalleries} from "./utils";
import {GlobalStore} from "./store";
import {ChapterImage, ChapterInfo, Gallery, GalleryInfo, Genre, GetGalleryListRequest, UserData} from "./type";

export class API {
    private client = new NetworkClientBuilder()
        .addRequestInterceptor(AuthInterceptor)
        .build();

    async handleAuth(username: string, password: string) {
        const domain = await GlobalStore.getDomain();
        const request = {
            url: domain + API_LOGIN,
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "x-requested-with": "XMLHttpRequest"
            },
            body: {
                action: "login",
                username: username,
                password: password,
            },
            method: "POST"
        }
        console.log(`Performing a request: ${JSON.stringify(request)}`)
        const response = await this.client.request(request)
        const setCookies = response.headers['Set-Cookie']
        console.log(setCookies)
        const sessionCookie = getCookieValue(setCookies, CookieNameSession)
        const passwordCookie = getCookieValue(setCookies, CookieNamePassword)
        console.log(sessionCookie, passwordCookie)
        await SecureStore.set(CookieNameSession, sessionCookie);
        await SecureStore.set(CookieNamePassword, passwordCookie);
        const userId = await this.getUserId()
        const userData = await this.getUserData(userId)
        await SecureStore.set(UserId, userId)
        await SecureStore.set(UserName, userData.name)
        await SecureStore.set(Avatar, userData.avatar)
    }

    async getUserData(userId: string): Promise<UserData> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain}${API_GET_USER_DATA}?data=info&user=${userId}`
        return this.requestJSON({url, method: "GET"});
    }

    async getGalleryInfo(galleryId: string): Promise<GalleryInfo> {
        const domain = await GlobalStore.getDomain()
        const $ = await this.fetchHTML(`${domain}/album/${galleryId}`)
        return getGalleryFromCheerio($)
    }

    async getGalleryList(request: GetGalleryListRequest): Promise<Gallery[]> {
        const domain = await GlobalStore.getDomain()
        const queryString = Object.entries(request)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        const url = `${domain + API_HOME_ALBUM_LIST}?${queryString}`
        const json = await this.requestJSON(
            {
                url,
                method: "GET"
            }
        )
        return parseGalleries(json.data)
    }

    async getSuggestGalleryList(): Promise<Gallery[]> {
        const userId = await SecureStore.string(UserId)
        if (!userId) {
            return []
        }
        const domain = await GlobalStore.getDomain()
        const url = `${domain + API_ALBUM_SUGGEST}?user=${userId}`
        const galleries = await this.requestJSON({url, method: "GET"});
        return parseGalleries(galleries.data)
    }

    async getUserGalleryList(type: string, page: number): Promise<Gallery[]> {
        const userId = await SecureStore.string(UserId)
        if (!userId) {
            return []
        }
        const domain = await GlobalStore.getDomain()
        const url = `${domain + API_GET_USER_LIST}?type=${type}&limit=20&user=${userId}&page=${page}`
        const galleries = await this.requestJSON({url, method: "GET"});
        return parseGalleries(galleries.data)
    }

    async getTopGalleryList(type: string): Promise<Gallery[]> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain + API_HOME_ALBUM_TOP}?type=${type}&limit=10`
        const galleries = await this.requestJSON({url, method: "GET"});
        return parseGalleries(galleries)
    }

    async getSearchGalleries(keyword: string): Promise<Gallery[]> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain + API_SEARCH}?string=${keyword}`
        const galleries = await this.requestJSON({url, method: "GET"});
        return parseGalleries(galleries)

    }

    async getChapterList(galleryId: string, page: number): Promise<ChapterInfo[]> {
        const domain = await GlobalStore.getDomain()
        const id = galleryId.split("-").pop() || "0"
        const url = `${domain + API_CHAPTER_LIST}?album=${id}&page=${page}&limit=${BATCH_SIZE_GET_CHAPTER_LIST}`
        const chapters = await this.requestJSON({url, method: "GET"});
        return parseChapters(chapters)

    }

    async getChapterImages(chapterId: string): Promise<string[]> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain + API_CHAPTER_IMAGE}?chapter=${chapterId}&v=0`
        const chapterImage: ChapterImage = await this.requestJSON({url, method: "GET"});
        const images = parseChapterImages(chapterImage)
        void this.preload(images)
        return images
    }

    async preload(chapterImages: string[]) {
        const domain = await GlobalStore.getDomain()
        for (const url of chapterImages) {
            void this.client.get(url, {headers: {Referer: domain + "/"}})
        }
    }

    async getGenres(): Promise<Record<string, Genre>> {
        const domain = await GlobalStore.getDomain()
        const url = domain + API_GET_TAGS
        return this.requestJSON({url, method: "GET"});
    }

    async getUserId() {
        const $ = await this.fetchHTML(await GlobalStore.getDomain())
        const scriptTag = $('script:contains("token_user")');
        let userId = '';
        if (scriptTag.length > 0) {
            const scriptContent = scriptTag.html();
            if (scriptContent) {
                // Extract the value of token_user using regex
                const match = scriptContent.match(/token_user\s*=\s*(\d+);/);
                if (match && match.length > 1) {
                    userId = match[1] || "";
                }
            }
        }
        return userId
    }

    async markChapterAsRead(chapterId: string) {
        const domain = await GlobalStore.getDomain()
        const request = {
            url: domain + API_USER_OPERATION,
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "x-requested-with": "XMLHttpRequest"
            },
            body: {
                action: "chapter_view",
                chapter_id: chapterId,
            },
            method: "POST"
        }
        console.log(`Performing a request: ${JSON.stringify(request)}`)
        await this.client.request(request)
        return
    }

    async followManga(contentId: string) {
        const domain = await GlobalStore.getDomain()
        const request = {
            url: domain + API_USER_OPERATION,
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "x-requested-with": "XMLHttpRequest"
            },
            body: {
                action: "album_follow",
                album: contentId,
                follow_check: 1,
            },
            method: "POST"
        }
        console.log(`Performing a request: ${JSON.stringify(request)}`)
        await this.client.request(request)
        return
    }

    async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }

    private async requestJSON(request: NetworkRequest) {
        try {
            console.log(`Performing JSON request: ${JSON.stringify(request)}`);
            const {data: resp} = await this.client.request(request);
            console.log(`Received response: ${resp}`)
            return JSON.parse(resp) ?? resp;
        } catch (ex) {
            const err = <NetworkError>ex
            console.error('Error occurred during JSON request:', err);
            throw ex;
        }
    }
}

async function getGalleryFromCheerio($: CheerioAPI): Promise<GalleryInfo> {
    const domain = await GlobalStore.getDomain()
    const title = $('p[itemprop="name"]').text().trim();
    const cover = domain + $('img[itemprop="image"]').attr('src')
    const tags: string[] = [];
    $('.kind span a[itemprop="genre"]').each((_, element) => {
        tags.push($(element).text().trim());
    });
    const status: string = $('.status').text().trim();
    const views: string = $('.total_view').text().trim();
    const follows: string = $('.bookmark').text().trim();
    const description = $('div#book_detail').text().trim()
    const last_update = $('.last_update').text().trim();
    return {title, cover, status, tags, views, follows, description, last_update}
}