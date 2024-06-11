import {IMAGE_SERVER_DOMAIN, PREF_KEYS, SERVER_1} from "./constants";
import _ from "lodash";

export class Store {

    async getImageServer(): Promise<string> {
        return await ObjectStore.string(PREF_KEYS.image_server) || SERVER_1;
    }

    async getImageServerId() {
        const server = await ObjectStore.string(PREF_KEYS.image_server) || SERVER_1;
        return _.invert(IMAGE_SERVER_DOMAIN)[server] || ""
    }

    async setImageServer(v: string) {
        return ObjectStore.set(PREF_KEYS.image_server, IMAGE_SERVER_DOMAIN[v]);
    }

    async getImageQuality(): Promise<string> {
        const quality = await ObjectStore.string(PREF_KEYS.image_quality);
        if (!quality) return "hq";
        return quality;
    }

    async setImageQuality(v: string) {
        return ObjectStore.set(PREF_KEYS.image_quality, v);
    }
}

export const GlobalStore = new Store();
