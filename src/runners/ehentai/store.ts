import {PREF_KEYS} from "./constants";

export class Store {
    async getExcludeTags(): Promise<string[]> {
        const tags = await ObjectStore.stringArray(PREF_KEYS.exclude_tags);
        if (!tags) return []
        return tags;
    }

    async setExcludeTags(v: string[]) {
        return ObjectStore.set(PREF_KEYS.exclude_tags, v);
    }

    async getRelatedGalleriesToggle(): Promise<boolean> {
        const value = await ObjectStore.boolean(PREF_KEYS.related_galleries);
        return !!value;
    }

    async setRelatedGalleriesToggle(v: boolean) {
        return ObjectStore.set(PREF_KEYS.related_galleries, v);
    }

    async getNumGalleries(): Promise<number> {
        const getNumGalleries = await ObjectStore.number(PREF_KEYS.number_of_galleries)
        if (!getNumGalleries) return 5;
        return getNumGalleries
    }

    async setNumGalleries(v: number) {
        return ObjectStore.set(PREF_KEYS.number_of_galleries, v);
    }
}

export const GlobalStore = new Store();
