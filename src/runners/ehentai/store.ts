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

    async getWorkerCount() {
        const value = await ObjectStore.number(PREF_KEYS.worker_count);
        if (!value) return 5;
        return value
    }

    async setWorkerCount(v: number) {
        return ObjectStore.set(PREF_KEYS.worker_count, v);
    }
}


export const GlobalStore = new Store();