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
}

export const GlobalStore = new Store();
