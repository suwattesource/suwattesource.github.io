import _ from "lodash";
import {DEFAULT_IMAGE_SERVER_DOMAIN, HENTAIVN_DOMAIN, IMAGE_SERVER_DOMAIN, PREF_KEYS} from "./constants";

export class Store {

    async getExcludeCategories(): Promise<string[]> {
        const tags = await ObjectStore.stringArray(PREF_KEYS.exclude_categories);
        if (!tags) return [];
        return tags;
    }

    async setExcludeCategories(v: string[]) {
        return ObjectStore.set(PREF_KEYS.exclude_categories, v);
    }

    async getImageServer(): Promise<string> {
        return await ObjectStore.string(PREF_KEYS.image_server) || DEFAULT_IMAGE_SERVER_DOMAIN;
    }

    async getImageServerName() {
        const server = await ObjectStore.string(PREF_KEYS.image_server) || DEFAULT_IMAGE_SERVER_DOMAIN;
        return _.invert(IMAGE_SERVER_DOMAIN)[server] || ""
    }


    async setImageServer(v: string) {
        return ObjectStore.set(PREF_KEYS.image_server, IMAGE_SERVER_DOMAIN[v]);
    }

    async getDomain() {
        const value = await ObjectStore.string(PREF_KEYS.domain);
        if (!value) {
            return HENTAIVN_DOMAIN
        }
        return value
    }

    async setDomain(domain: string) {
        if (!this.isValidDomain(domain.trim())) {
            await ObjectStore.set(PREF_KEYS.domain, HENTAIVN_DOMAIN);
            return;
        }
        await ObjectStore.set(PREF_KEYS.domain, domain.trim());
    }

    isValidDomain(domain: string): boolean {
        // Regular expression for matching a valid domain with http or https
        const domainRegex = /^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Test the domain against the regex
        return domainRegex.test(domain);
    }
}


export const GlobalStore = new Store();