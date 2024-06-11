import {DirectoryFilter, FilterType, Option, PageSection, PublicationStatus, SectionStyle, Tag} from "@suwatte/daisuke"

export const READCOMICONLINE_URL = "https://readcomiconline.li"


export const PREF_KEYS = {
    cache_cover: "cover",
    request: "request",
    domain: "domain",
    image_server: "image_server",
    image_quality: "image_quality"
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "Ongoing": PublicationStatus.ONGOING,
    "Completed": PublicationStatus.COMPLETED,
};


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "new-comic",
        title: "New comic",
        style: SectionStyle.INFO,
        viewMoreLink: {request: {page: 1, sort: {id: "Newest"}}},
    },
    {
        id: "most-popular",
        title: "Most popular",
        style: SectionStyle.GALLERY,
        viewMoreLink: {request: {page: 1, sort: {id: "MostPopular"}}},
    },
    {
        id: "latest",
        title: "Latest update",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: "LatestUpdate"}}},
    },
];

export const SEARCH_SORTERS: Option[] = [
    {id: "LatestUpdate", title: "Latest Update"},
    {id: "Newest", title: "Newest"},
    {id: "MostPopular", title: "Most Popular"},
    {id: "Alphabet", title: "Alphabet"},
];

export const STATUES: Tag[] = [
    {
        title: "Ongoing",
        id: "Ongoing",
    },
    {
        title: "Completed",
        id: "Completed",
    }
]


export const DEFAULT_FILTERS: DirectoryFilter[] = [
    {
        id: "name",
        title: "Name",
        type: FilterType.TEXT,
    },
    {
        id: "status",
        title: "Status",
        type: FilterType.SELECT,
        options: STATUES
    },
    {
        id: "year",
        title: "Year",
        subtitle: "From 1970 - now",
        type: FilterType.TEXT,
    },
];

export const IMAGE_QUALITIES: Option[] = [
    {
        id: "hq",
        title: "High Quality",
    },
    {
        id: "lq",
        title: "Low Quality",
    },
];

export const IMAGE_SERVERS: Option[] = [
    {
        id: "server_1",
        title: "Server 1",
    },
    {
        id: "server_2",
        title: "Server 2",
    }
];

export const SERVER_1 = "https://2.bp.blogspot.com";
export const SERVER_2 = "https://img2.whatsnew247.net/pic"
export const IMAGE_SERVER_DOMAIN: Record<string, string> = {
    "server_1": SERVER_1,
    "server_2": SERVER_2,
};
