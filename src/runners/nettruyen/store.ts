import {DEFAULT_IMAGE_SERVER_DOMAIN, IMAGE_SERVER_DOMAIN, NETTRUYEN_DOMAIN, PREF_KEYS} from "./constants";
import _ from "lodash";

export class Store {
    async getImageServer(): Promise<string> {
        const server = await ObjectStore.string(PREF_KEYS.image_server);
        if (!server) return DEFAULT_IMAGE_SERVER_DOMAIN;
        return server;
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
            return NETTRUYEN_DOMAIN
        }
        return value
    }

    async setDomain(domain: string) {
        if (!this.isValidDomain(domain.trim())) {
            await ObjectStore.set(PREF_KEYS.domain, NETTRUYEN_DOMAIN);
            return;
        }
        await ObjectStore.set(PREF_KEYS.domain, domain.trim());
    }

    isValidDomain(domain: string): boolean {
        // Regular expression for matching a valid domain with http or https
        const domainRegex: RegExp = /^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Test the domain against the regex
        return domainRegex.test(domain);
    }
}

export const GlobalStore = new Store();
