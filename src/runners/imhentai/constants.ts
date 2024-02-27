import {
  Option,

} from "@suwatte/daisuke";

export const IMHENTAI_DOMAIN = "https://imhentai.xxx";

export const SEARCH_SORTERS: Option[] = [
  {
    id: "lt",
    title: "Latest",
  },
  {
    id: "pp",
    title: "Popular",
  },
  {
    id: "dl",
    title: "Top Downloaded",
  },
  {
    id: "tr",
    title: "Top Rated",
  },
];

interface LanguageMapping {
  [key: string]: string;
}

export const LANGUAGE_MAPPING: LanguageMapping = {
  "2": "English",
  "1": "Japanese",
  "6": "Spanish",
  "8": "French",
  "7": "Korean",
  "5": "German",
  "10": "Russian",
  "3": "UNKNOWN"
};


