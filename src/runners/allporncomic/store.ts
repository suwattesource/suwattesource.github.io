import {PREF_KEYS} from "./constants";

export class Store {
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