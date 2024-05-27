import {Option, PageSection, SectionStyle} from "@suwatte/daisuke";

export const SAYHENTAI_DOMAIN = "https://sayhentai.co";

export const PREF_KEYS = {
    request: "request",
    exclude_categories: "exclude_categories",
    domain: "domain",
};

export const MANGA_TYPES = ["Manga"];


export const SEARCH_SORTERS: Option[] = [
    {
        id: "latest",
        title: "Mới nhất",
    },
    {
        id: "rating",
        title: "Đánh giá cao",
    },
    {
        id: "views",
        title: "Xem nhiều",
    },
    {
        id: "new",
        title: "Ngày đăng",
    }
];


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "sayhentai",
        title: "Truyện Nhóm Dịch SayHentai",
        style: SectionStyle.INFO,
    },
    {
        id: "top-day",
        title: "Top Ngày",
        style: SectionStyle.GALLERY,
    },
    {
        id: "new-manga",
        title: "Truyện Mới",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "new-update",
        title: "Mới Cập Nhật",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    },
];

export const DEFAULT_EXCLUDED_TAGS = ["/the-loai-55-guro.html", "/the-loai-134-scat.html", "/the-loai-96-yaoi.html"]