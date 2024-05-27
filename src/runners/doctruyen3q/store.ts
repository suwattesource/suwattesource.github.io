import {DOCTRUYEN3Q_DOMAIN, PREF_KEYS} from "./constants";

export class Store {
    async getDomain() {
        const value = await ObjectStore.string(PREF_KEYS.domain);
        if (!value) {
            return DOCTRUYEN3Q_DOMAIN
        }
        return value
    }

    async setDomain(domain: string) {
        if (!this.isValidDomain(domain.trim())) {
            await ObjectStore.set(PREF_KEYS.domain, DOCTRUYEN3Q_DOMAIN);
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
