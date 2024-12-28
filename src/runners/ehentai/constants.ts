import {DirectoryFilter, FilterType, Option, PageSection, SectionStyle,} from "@suwatte/daisuke";

export const EHENTAI_DOMAIN = "https://e-hentai.org";

export const PREF_KEYS = {
    cache_next_id: "next_id",
    cache_request: "request",
    cache_request_url: "request_url",
    cache_tags: "tags_",
    exclude_tags: "exclude_tags",
    related_galleries: "related_galleries",
    number_of_galleries: "number_of_galleries",
};

export const VERTICAL_READING_TYPES = ["webtoon"];

export const MANGA_READING_TYPES = ["manga", "doujinshi"];

export const EXTENDED_DISPLAY_COOKIE = {name: "sl", value: "dm_2"}

export const LOGIN_COOKIES = [
    {name: "sl", value: "dm_2"},
    {name: "ipb_member_id", value: "6641173"},
    {name: "ipb_pass_hash", value: "d77d14d9d996dc447d9d374771cc4b0c"}
]

export const TOPLIST_PAGES = [
    {
        title: " Galleries Yesterday",
        id: "15",
    },
    {
        title: "Galleries Past Month",
        id: "13",
    },
    {
        title: " Galleries Past Year",
        id: "12",
    },
    {
        title: "Galleries All-Time",
        id: "11",
    }
]

export const LANGUAGES = [
    {
        label: "Chinese",
        languageCode: "zh",
        regionCode: "cn",
    },
    {
        label: "Chinese TR",
        languageCode: "zh",
        regionCode: "tw",
    },
    {
        label: "English",
        languageCode: "en",
        regionCode: "gb",
    },
    {
        label: "Japanese",
        languageCode: "ja",
        regionCode: "jp",
    },
    {
        label: "Spanish",
        languageCode: "es",
        regionCode: "es",
    },
    {
        label: "French",
        languageCode: "fr",
        regionCode: "fr",
    },
    {
        label: "Korean",
        languageCode: "ko",
        regionCode: "kr",
    },
    {
        label: "German",
        languageCode: "de",
        regionCode: "de",
    },
    {
        label: "Russian",
        languageCode: "ru",
        regionCode: "ru",
    },
    {
        label: "Vietnamese",
        languageCode: "vi",
        regionCode: "vn",
    }
]

export const CATEGORIES: Option[] = [
    {
        "id": "2",
        "title": "Doujinshi",
    },
    {
        "id": "4",
        "title": "Manga",
    },
    {
        "id": "8",
        "title": "Artist CG",
    },
    {
        "id": "16",
        "title": "Game CG",
    },
    {
        "id": "512",
        "title": "Western",
    },
    {
        "id": "256",
        "title": "Non-H",
    },
    {
        "id": "32",
        "title": "Image Set",
    },
    {
        "id": "64",
        "title": "Cosplay",
    },
    {
        "id": "128",
        "title": "Asian Porn",
    },
    {
        "id": "1",
        "title": "Misc",
    }
]

export const FILTERS: DirectoryFilter[] = [
    {
        id: "category",
        title: "Category",
        subtitle: "To exclude",
        options: CATEGORIES,
        type: FilterType.MULTISELECT,
    }
];


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "popular",
        title: "Popular",
        style: SectionStyle.GALLERY,
    },
    {
        id: "front_page",
        title: "Front Page",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    },
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "lt",
        title: "Latest",
    },
];

export const EHENTAI_TAG_LINKS = [
    "https://repo.e-hentai.org/tools/taggroup?show=7",
    "https://repo.e-hentai.org/tools/taggroup?show=8",
    "https://repo.e-hentai.org/tools/taggroup?show=9",
    "https://repo.e-hentai.org/tools/taggroup?show=11"
]
