import {DEFAULT_IMAGE_SERVER_DOMAIN, IMAGE_SERVER_DOMAIN, PREF_KEYS, TRUYENQQ_DOMAIN} from "./constants";

export class Store {
    async getImageServer(): Promise<string> {
        const server = await ObjectStore.string(PREF_KEYS.image_server);
        if (!server) return DEFAULT_IMAGE_SERVER_DOMAIN;
        return server;
    }

    async setImageServer(v: string) {
        return ObjectStore.set(PREF_KEYS.image_server, IMAGE_SERVER_DOMAIN[v]);
    }

    async getDomain() {
        const value = await ObjectStore.string(PREF_KEYS.domain);
        if (!value) {
            return TRUYENQQ_DOMAIN
        }
        return value
    }

    async setDomain(domain: string) {
        if (!this.isValidDomain(domain.trim())) {
            await ObjectStore.set(PREF_KEYS.domain, TRUYENQQ_DOMAIN);
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
