import {
  Option,
  DirectoryFilter,
  FilterType,

} from "@suwatte/daisuke";

export const IMHENTAI_DOMAIN = "https://imhentai.xxx";

export const REQUEST_CACHE_KEY = "request";

const CATEGORIES: Option[] = [
  {
    "id": "m",
    "title": "Manga",
  },
  {
    "id": "d",
    "title": "Doujinshi",
  },
  {
    "id": "w",
    "title": "Western",
  },
  {
    "id": "i",
    "title": "Image Set",
  },
  {
    "id": "a",
    "title": "Artist CG",
  },
  {
    "id": "g",
    "title": "Game CG",
  }
]

const LANGUAGES: Option[] = [
  {
    "id": "en",
    "title": "English",
  },
  {
    "id": "jp",
    "title": "Japanese",
  },
  {
    "id": "es",
    "title": "Spanish",
  },
  {
    "id": "fr",
    "title": "French",
  },
  {
    "id": "kr",
    "title": "Korean",
  },
  {
    "id": "de",
    "title": "German",
  },
  {
    "id": "ru",
    "title": "Russian",
  }
]

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


export const FILTERS: DirectoryFilter[] = [
  {
    id: "term",
    title: "Term",
    subtitle: "Use a comma (,) after each tag, for example (anal,big breasts).",
    type: FilterType.TEXT,
  },
  {
    id: "advsearch",
    title: "Use Advanced Search",
    subtitle: `Use "+" to include a tag and "-" to exclude, for example: (+tag:"Big Breasts" -tag:"Anal")`,
    type: FilterType.TOGGLE,
  },
  {
    id: "category",
    title: "Category",
    subtitle: "To exclude",
    options: CATEGORIES,
    type: FilterType.MULTISELECT,
  },
  {
    id: "language",
    title: "Language",
    subtitle: "To exclude",
    options: LANGUAGES,
    type: FilterType.MULTISELECT,
  },
];
