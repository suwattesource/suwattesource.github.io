import {DirectoryFilter, FilterType, Option, PageSection, SectionStyle,} from "@suwatte/daisuke";


export const ALLPORNCOMIC_DOMAIN = "https://allporncomic.com";


export const PREF_KEYS = {
    request: "request",
    domain: "domain",
    cache_chapter_images: "chapter_images",
    number_of_images_per_chapter: "number_of_images_per_chapter",
}


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Trending",
        style: SectionStyle.INFO,
    },
    {
        id: "views",
        title: "Most Views",
        style: SectionStyle.GALLERY,
    },
    {
        id: "latest",
        title: "Latest",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    },
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "latest",
        title: "Latest",
    },
    {
        id: "alphabet",
        title: "A-Z",
    },
    {
        id: "rating",
        title: "Rating",
    },
    {
        id: "trending",
        title: "Trending",
    },
    {
        id: "views",
        title: "Most Views",
    },
    {
        id: "new-manga",
        title: "New Manga",
    }
];

export const STATUSES: Option[] = [
    {
        id: "on-going",
        title: "On Going",
    },
    {
        id: "end",
        title: "Completed",
    },
    {
        id: "canceled",
        title: "Cancelled",
    },
    {
        id: "on-hold",
        title: "On Hold",
    },
    {
        id: "upcoming",
        title: "Upcoming",
    },
];

export const DEFAULT_FILTERS: DirectoryFilter[] = [
    {
        id: "title",
        title: "Title",
        type: FilterType.TEXT,
    },
    {
        id: "condition",
        title: "Is AND genres condition",
        type: FilterType.TOGGLE,
    },
    {
        id: "author",
        title: "Author",
        type: FilterType.TEXT,
    },
    {
        id: "artist",
        title: "Artist",
        type: FilterType.TEXT,
    },
    {
        id: "year",
        title: "Year of Release",
        type: FilterType.TEXT,
    },
    {
        id: "status",
        title: "Status",
        type: FilterType.MULTISELECT,
        options: STATUSES,
    }
];
