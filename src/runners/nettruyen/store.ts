import { NETTRUYEN_DOMAIN } from "./constants";

export class Store {
    async domain() {
        const value = await ObjectStore.string("domain");
        if (typeof value !== "string" || !this.isValidDomain(value)) {
            return NETTRUYEN_DOMAIN;
        }
        return value
    }
    
    isValidDomain(domain: string): boolean {
        // Regular expression for matching a valid domain with http or https
        const domainRegex: RegExp = /^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        // Test the domain against the regex
        return domainRegex.test(domain);
    }
}
