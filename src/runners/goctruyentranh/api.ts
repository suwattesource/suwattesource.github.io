import {NetworkRequest} from "@suwatte/daisuke";
import {
    API_CATEGORY,
    API_CHAPTER_IMAGES,
    API_GET_CHAPTER_LIST,
    API_HOME_FILTER,
    API_SEARCH,
    AUTH_TOKEN
} from "./constants";
import {GlobalStore} from "./store";
import {Category, ChapterInfo, Gallery, GetGalleryListRequest, SearchGalleryRequest} from "./type";
import {buildQueryString, parseCategories, parseChapterImages, parseChapters, parseGalleries} from "./utils";
import memoryCache, {CacheClass} from "memory-cache";

export class API {
    private cache: CacheClass<string, Gallery> = new memoryCache.Cache();
    private client = new NetworkClient();

    getGalleryInfo(galleryId: string): Gallery | null {
        return this.cache.get(galleryId)
    }

    async getHomeGalleryList(request: GetGalleryListRequest): Promise<Gallery[]> {
        const domain = await GlobalStore.getDomain()
        if (request.value != "favorite") {
            return this.searchGalleries({
                p: request.p,
                orders: [request.value],
            })
        }

        const fetchGalleryPage = async (page: number) => {
            const queryString = Object.entries({...request, p: page})
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            const url = `${domain + API_HOME_FILTER}?${queryString}`;
            const resp = await this.requestJSON({url, method: "GET"});
            return parseGalleries(resp);
        };

        const pagePromises = Array.from({length: 4}, (_, i) => fetchGalleryPage(i));
        const results = await Promise.all(pagePromises);

        const allGalleries = results.flat();
        allGalleries.forEach(gallery => {
            this.cache.put(gallery.id, gallery);
        });

        return allGalleries;
    }

    async searchGalleries(request: SearchGalleryRequest): Promise<Gallery[]> {
        const domain = await GlobalStore.getDomain()
        const query = buildQueryString(request)
        const url = `${domain}${API_SEARCH}?${query}`
        const json = await this.requestJSON(
            {
                url,
                method: "GET"
            }
        )
        const galleries = parseGalleries(json)
        galleries.forEach(gallery => {
            this.cache.put(gallery.id, gallery);
        });
        return galleries
    }

    async getChapterList(galleryId: string): Promise<ChapterInfo[]> {
        const domain = await GlobalStore.getDomain()
        const url = `${domain}${API_GET_CHAPTER_LIST.replace('comicID', galleryId)}?offset=0&limit=-1`
        const json = await this.requestJSON(
            {
                url,
                method: "GET"
            }
        )
        return parseChapters(json)
    }

    async getChapterImages(comicId: string, chapterNumber: string): Promise<string[]> {
        const domain = await GlobalStore.getDomain()
        const url = domain + API_CHAPTER_IMAGES
        const json = await this.requestJSON(
            {
                url,
                method: "POST",
                headers: {
                    'authorization': AUTH_TOKEN,
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': "XMLHttpRequest"
                },
                body: {
                    comicId: comicId,
                    chapterNumber: chapterNumber,
                }
            }
        )
        return parseChapterImages(json)
    }

    async getCategories(): Promise<Category[]> {
        const domain = await GlobalStore.getDomain()
        const url = domain + API_CATEGORY
        const json = await this.requestJSON({url, method: "GET",}
        )
        return parseCategories(json)
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