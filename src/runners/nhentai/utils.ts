import {LANGUAGES} from "./constants";

export function getLanguage(dataTags: number[]): string {
    for (const dataTag of dataTags) {
        const language = LANGUAGES.find(lang => lang.tagId == dataTag);
        if (language) {
            return language.label
        }
    }
    return ""
}