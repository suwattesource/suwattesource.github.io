import {NetworkRequest, NetworkRequestConfig} from "@suwatte/daisuke";
import {Gallery, SearchGalleryRequest} from "./type";
import {NHENTAI_DOMAIN} from "./constants";
import {load} from "cheerio";

export class API {
    private client = new NetworkClient();

    async getGallery(galleryId: string): Promise<Gallery> {
        const req = {
            url: `https://nhentai.net/api/gallery/${galleryId}`,
            method: "GET",
        }

        return await this.requestJSON(req)
    }

    async searchGalleries(request: SearchGalleryRequest): Promise<Gallery[]> {
        if (request.tagId) {
            return this.getTaggedGalleries(request)
        }

        let url = `${NHENTAI_DOMAIN}/api/galleries/search?query=%22%22`
        if (request.query && request.query != "") {
            url = `${NHENTAI_DOMAIN}/api/galleries/search?query=${encodeURI(request.query)}`
        }
        if (request.sort) {
            url += `&sort=${request.sort}`
        }
        url += `&page=${request.page ? request.page : 1}`
        const req = {
            url,
            method: "GET"
        }
        const json = await this.requestJSON(req)
        return json.result
    }

    async getSimilarGalleries(galleryId: string): Promise<Gallery[]> {
        const req = {
            url: `${NHENTAI_DOMAIN}/api/gallery/${galleryId}/related`,
            method: "GET",
        }
        const json = await this.requestJSON(req)
        return json.result
    }

    async fetchHTML(url: string, config?: NetworkRequestConfig) {
        console.log(`Requesting to the url: ${url}${config ? ", config: " + JSON.stringify(config) : ""}`)
        const response = await this.client.get(url, config);
        return load(response.data);
    }

    private async getTaggedGalleries(request: SearchGalleryRequest): Promise<Gallery[]> {
        let url = `${NHENTAI_DOMAIN}/api/galleries/tagged?tag_id=${request.tagId}&page=${request.page}`;

        if (request.sort) {
            url += `&sort=${request.sort}`
        }
        const req = {
            url,
            method: "GET",
        }
        const json = await this.requestJSON(req)
        return json.result
    }

    private async requestJSON(request: NetworkRequest) {
        try {
            console.log(`Performing JSON request: ${JSON.stringify(request)}`);
            const {data: resp} = await this.client.request(request);
            return JSON.parse(resp) ?? resp;
        } catch (ex) {
            const err = <NetworkError>ex
            if (err?.res?.status == 404) {
                return {
                    result: []
                }
            }
            console.error('Error occurred during JSON request:', err);
            throw ex;
        }
    }

}