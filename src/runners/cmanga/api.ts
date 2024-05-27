import {NetworkRequest, NetworkRequestConfig} from "@suwatte/daisuke";
import {
    API_CHAPTER_IMAGE,
    API_CHAPTER_LIST,
    API_GET_TAGS,
    API_HOME_ALBUM_LIST,
    API_HOME_ALBUM_TOP,
    API_SEARCH,
    BATCH_SIZE_GET_CHAPTER_LIST
} from "./constants";
import {CheerioAPI, load} from "cheerio";
import {parseChapters, parseGalleries} from "./utils";
import {GlobalStore} from "./store";
import {ChapterInfo, Gallery, GalleryInfo, Genre, GetGalleryListRequest} from "./type";

export class API {
    private client = new NetworkClient();

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
        return this.requestJSON({url, method: "GET"});
    }

    async getGenres(): Promise<Record<string, Genre>> {
        const domain = await GlobalStore.getDomain()
        const url = domain + API_GET_TAGS
        return this.requestJSON({url, method: "GET"});
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