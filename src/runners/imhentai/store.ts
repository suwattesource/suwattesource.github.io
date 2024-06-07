import {DEFAULT_EXCLUDED_TAGS, PREF_KEYS} from "./constants";

export class Store {
    async getExcludeTagIDs(): Promise<Number[]> {
        const tagIDs = await this.getExcludeTags()
        return tagIDs.map(id => parseInt(id))
    }

    async getExcludeTags(): Promise<string[]> {
        const tags = await ObjectStore.stringArray(PREF_KEYS.exclude_tags);
        if (!tags) return DEFAULT_EXCLUDED_TAGS;
        return tags;
    }

    async setExcludeTags(v: string[]) {
        return ObjectStore.set(PREF_KEYS.exclude_tags, v);
    }

    async getNumPages(): Promise<number> {
        const numPages = await ObjectStore.number(PREF_KEYS.number_of_tag_pages)
        if (!numPages) return 5;
        return numPages
    }

    async setNumPages(v: number) {
        return ObjectStore.set(PREF_KEYS.number_of_tag_pages, v);
    }

    async getNumImages(): Promise<number> {
        const numImages = await ObjectStore.number(PREF_KEYS.number_of_images_per_chapter)
        if (!numImages) return 0;
        return numImages
    }

    async setNumImages(v: number) {
        return ObjectStore.set(PREF_KEYS.number_of_images_per_chapter, v);
    }
}


export const GlobalStore = new Store();