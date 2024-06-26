import {PREF_KEYS, SAYHENTAI_DOMAIN} from "./constants";

export class Store {

    async getDomain() {
        const value = await ObjectStore.string(PREF_KEYS.domain);
        if (!value) {
            return SAYHENTAI_DOMAIN
        }
        return value
    }

    async setDomain(domain: string) {
        if (!this.isValidDomain(domain.trim())) {
            await ObjectStore.set(PREF_KEYS.domain, SAYHENTAI_DOMAIN);
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