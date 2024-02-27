import entities = require('entities')
import { LANGUAGE_MAPPING } from './constants';

export const decodeHTMLEntity = (str: string): string => {
    return entities.decodeHTML(str)
}

export const getLanguage = (dataLanguages: string[]): string => {
    const sortedDataLanguages = dataLanguages.sort(); // Sort the languages numerically if necessary

    for (const language of sortedDataLanguages) {
        const code = LANGUAGE_MAPPING[language];
        if (code && code !== "UNKNOWN") {
            return code;
        }
    }
    return "UNKNOWN";
};