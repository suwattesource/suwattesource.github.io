import {Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";

export const MANHUAROCK_DOMAIN = "https://manhuarockz.com";
export const TWOTEN_DOMAIN = "https://2ten.net";
export const IMAGE_LIST = "/ajax/image/list/chap/{chapterID}?mode=vertical&quality=high"

export const PREF_KEYS = {
    request: "request",
    domain: "domain",
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "Đang tiến hành": PublicationStatus.ONGOING,
    "Đã hoàn thành": PublicationStatus.COMPLETED,
    "Tạm ngưng": PublicationStatus.HIATUS,
};

export const DOMAIN_OPTIONS: Option[] = [
    {
        title: MANHUAROCK_DOMAIN,
        id: MANHUAROCK_DOMAIN,
    },
    {
        title: TWOTEN_DOMAIN,
        id: TWOTEN_DOMAIN,
    },
];

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Top Phổ Biến",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "popular",
        title: "Xem Nhiều",
        style: SectionStyle.GALLERY,
    },
    {
        id: "new-update",
        title: "Mới Cập Nhật",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    }
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "latest-updated",
        title: "Mới Cập Nhật",
    },
    {
        id: "score",
        title: "Điểm",
    },
    {
        id: "name-az",
        title: "Tên A-Z",
    },
    {
        id: "release-date",
        title: "Ngày Phát Hành",
    },
    {
        id: "most-viewd",
        title: "Xem Nhiều",
    }
];
