import {PREF_KEYS} from "./constants";

export class Store {
    async getExcludeTags(): Promise<string[]> {
        const tags = await ObjectStore.stringArray(PREF_KEYS.exclude_tags);
        if (!tags) return [];
        return tags;
    }

    async setExcludeTags(v: string[]) {
        return ObjectStore.set(PREF_KEYS.exclude_tags, v);
    }

    async getNumPages(): Promise<number> {
        const numPages = await ObjectStore.number(PREF_KEYS.number_of_tag_pages)
        if (!numPages) return 3;
        return numPages
    }

    async setNumPages(v: number) {
        return ObjectStore.set(PREF_KEYS.number_of_tag_pages, v);
    }

    async getNumPagesToExclude(): Promise<number> {
        const numPages = await ObjectStore.number(PREF_KEYS.number_of_tag_pages_to_exclude)
        if (!numPages) return 5;
        return numPages
    }

    async setNumPagesToExclude(v: number) {
        return ObjectStore.set(PREF_KEYS.number_of_tag_pages_to_exclude, v);
    }
}


export const GlobalStore = new Store();