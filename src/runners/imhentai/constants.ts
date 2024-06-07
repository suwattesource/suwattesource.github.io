import {DirectoryFilter, FilterType, Option, PageSection, SectionStyle,} from "@suwatte/daisuke";

export const IMHENTAI_DOMAIN = "https://imhentai.xxx";

export const PREF_KEYS = {
    cache_chapter_images: "chapter_images",
    cache_request: "request",
    cache_tags: "tags_",
    lang: "language",
    exclude_tags: "exclude_tags",
    number_of_tag_pages: "number_of_tag_pages",
    number_of_images_per_chapter: "number_of_images_per_chapter"
};

export const COMPLETED_STATUS_DATE_THRESHOLD = 1000 * 60 * 60 * 24 * 365; // milliseconds in a year
export const VERTICAL_READING_TYPES = ["Webtoon"];
export const MANGA_READING_TYPES = ["Manga", "Doujinshi"];
export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "manga",
        title: "Manga",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1,
                tag: {
                    tagId: "/category/manga/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
    {
        id: "doujinshi",
        title: "Doujinshi",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1,
                tag: {
                    tagId: "/category/doujinshi/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
    {
        id: "western",
        title: "Western",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1,
                tag: {
                    tagId: "/category/western/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
    {
        id: "image-set",
        title: "Image Set",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1,
                tag: {
                    tagId: "/category/image-set/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
    {
        id: "artist-cg",
        title: "Artist CG",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1,
                tag: {
                    tagId: "/category/artist-cg/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
    {
        id: "game-cg",
        title: "Game CG",
        style: SectionStyle.GALLERY,
        viewMoreLink: {
            request: {
                page: 1, tag: {
                    tagId: "/category/game-cg/",
                    propertyId: "category"
                },
                sort: {id: ""}
            }
        },
    },
];

export const SECTIONS: PageSection = {
    id: "section",
    title: "Sections",
    style: SectionStyle.TAG,
    items: [
        {
            id: "tags",
            title: "Tags",
            cover: "",
            link: {
                request: {
                    page: 1,
                    tag: {
                        propertyId: "section",
                        tagId: "tags"
                    }
                }
            }
        },
        {
            id: "artists",
            title: "Artists",
            cover: "",
            link: {
                request: {
                    page: 1,
                    tag: {
                        propertyId: "section",
                        tagId: "artists"
                    }
                }
            }
        },
        {
            id: "characters",
            title: "Characters",
            cover: "",
            link: {
                request: {
                    page: 1,
                    tag: {
                        propertyId: "section",
                        tagId: "characters"
                    }
                }
            }
        },
        {
            id: "parodies",
            title: "Parodies",
            cover: "",
            link: {
                request: {
                    page: 1,
                    tag: {
                        propertyId: "section",
                        tagId: "parodies"
                    }
                }
            }
        },
        {
            id: "groups",
            title: "Groups",
            cover: "",
            link: {
                request: {
                    page: 1,
                    tag: {
                        propertyId: "section",
                        tagId: "groups"
                    }
                }
            }
        }
    ]

}


const CATEGORIES: Option[] = [
    {
        id: "m",
        title: "Manga",
    },
    {
        id: "d",
        title: "Doujinshi",
    },
    {
        id: "w",
        title: "Western",
    },
    {
        id: "i",
        title: "Image Set",
    },
    {
        id: "a",
        title: "Artist CG",
    },
    {
        id: "g",
        title: "Game CG",
    }
]


export const LANGUAGES = [
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
    }
]

export const LANGUAGE_OPTIONS = LANGUAGES.map(
    language =>
        (
            {
                id: language.languageCode != "ja" && language.languageCode != "ko" ? language.languageCode : language.regionCode,
                title: language.label
            }
        )
)

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
        options: LANGUAGE_OPTIONS,
        type: FilterType.MULTISELECT,
    },
];


export const DEFAULT_EXCLUDED_TAGS = ["58", "117", "43"]  // guro, scat, yaoi

export const EXCLUDED_TAG: Option[] = [
    {
        title: "guro",
        id: "58",
    },
    {
        title: "scat",
        id: "117",
    },
    {
        title: "yaoi",
        id: "43",
    },
    {
        title: "bbw",
        id: "316",
    },
    {
        title: "bestiality",
        id: "70",
    },
    {
        title: "furry",
        id: "291"
    }
]

export const TAG_COVER_URL = "https://cdn.icon-icons.com/icons2/2406/PNG/512/tags_categories_icon_145927.png"
