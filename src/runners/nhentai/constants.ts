import {Option, PageSection, SectionStyle,} from "@suwatte/daisuke";
import {ImagePageObject} from "./type";

export const NHENTAI_DOMAIN = "https://nhentai.net";

export const PREF_KEYS = {
    cache_tags: "tags",
    cache_request: "request",
    cache_chapter_images: "chapter_images",
    exclude_tags: "exclude_tags",
    number_of_tag_pages: "number_of_tag_pages",
    number_of_tag_pages_to_exclude: "number_of_tag_pages_to_exclude",
    number_of_images_per_chapter: "number_of_images_per_chapter"
};


export const LANGUAGES = [
    {
        label: "English",
        languageCode: "en",
        regionCode: "gb",
        tagId: 12227,
    },
    {
        label: "Japanese",
        languageCode: "ja",
        regionCode: "jp",
        tagId: 6346,
    },
    {
        label: "Chinese",
        languageCode: "zh",
        regionCode: "cn",
        tagId: 29963,
    },
]
export const TAG_TYPES: Option[] = [
    {
        id: "parody",
        title: "Parodies"
    },
    {
        id: "character",
        title: "Characters"
    },
    {
        id: "tag",
        title: "Tags"
    },
    {
        id: "artist",
        title: "Artists"
    },
    {
        id: "group",
        title: "Groups"
    },
    {
        id: "language",
        title: "Languages"
    },
    {
        id: "category",
        title: "Categories"
    },
]

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "popular-today",
        title: "Popular Today",
        style: SectionStyle.GALLERY,
    },
    {
        id: "popular-week",
        title: "Popular Week",
        style: SectionStyle.GALLERY,
    },
    {
        id: "popular-month",
        title: "Popular Month",
        style: SectionStyle.GALLERY,
    },
    {
        id: "date",
        title: "New Uploads",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    },
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "date",
        title: "Recent",
    },
    {
        id: "popular-today",
        title: "Popular Today",
    },
    {
        id: "popular-week",
        title: "Popular Week",
    },
    {
        id: "popular-month",
        title: "Popular Month",
    },
    {
        id: "popular",
        title: "Popular All Time",
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

export const TAG_COVER_URL = "https://cdn.icon-icons.com/icons2/2406/PNG/512/tags_categories_icon_145927.png"

const typeMap: { [key: string]: string; } = {'j': 'jpg', 'p': 'png', 'g': 'gif'}

export const typeOfImage = (image: ImagePageObject): string => {
    return typeMap[image.t] ?? ''
}