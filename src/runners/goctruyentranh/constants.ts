import {DirectoryFilter, FilterType, Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";

export const GOCTRUYENTRANH_DOMAIN = "https://goctruyentranhvui1.com";
export const API_HOME_FILTER = "/api/v2/home/filter"
export const API_SEARCH = "/api/v2/search"
export const API_GET_CHAPTER_LIST = "/api/comic/comicID/chapter"
export const API_CHAPTER_IMAGES = "/api/chapter/limitation"
export const API_CATEGORY = "/api/category"
export const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJWxINuIEhvw6BuZyDEkGluaCIsImNvbWljSWRzIjpbXSwicm9sZUlkIjpudWxsLCJncm91cElkIjpudWxsLCJhZG1pbiI6ZmFsc2UsInJhbmsiOjAsInBlcm1pc3Npb24iOltdLCJpZCI6IjAwMDA1MjYzNzAiLCJ0ZWFtIjpmYWxzZSwiaWF0IjoxNzE1NDI0NDU3LCJlbWFpbCI6Im51bGwifQ.EjYw-HvoWM6RhbNzJkp06sSh61leaPcND0gb94PlDKeTYxfxU-f6WaxINAVjVYOP0pcVcG3YmfBVb4FVEBqPxQ'
export const PREF_KEYS = {
    request: "request",
    domain: "domain",
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "STA": PublicationStatus.ONGOING,
    "PRG": PublicationStatus.ONGOING,
    "END": PublicationStatus.COMPLETED,
    "PDG": PublicationStatus.HIATUS,
    "STO": PublicationStatus.CANCELLED,
};
export const VERTICAL_TYPES = ["Manhwa", "Manhua", "Truyện Màu", "Webtoons"];

const STATUES: Option[] = [
    {
        id: "STA",
        title: "Chưa bắt đầu",
    },
    {
        id: "STO",
        title: "Đã dừng",
    },
    {
        id: "PDG",
        title: "Hoãn lại",
    }, {
        id: "PRG",
        title: "Đang thực hiện",
    }, {
        id: "END",
        title: "Hoàn thành",
    }
]
export const DEFAULT_FILTERS: DirectoryFilter[] = [
    {
        id: "keyword",
        title: "Từ khoá",
        type: FilterType.TEXT,
    },
    {
        id: "status",
        title: "Trạng thái",
        type: FilterType.MULTISELECT,
        options: STATUES
    },
];


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "favorite",
        title: "Truyện Hay",
        style: SectionStyle.GALLERY,

    },
    {
        id: "createdAt",
        title: "Truyện Mới",
        style: SectionStyle.INFO,
        viewMoreLink: {request: {page: 1, sort: {id: "createdAt"}}},

    },
    {
        id: "viewCount",
        title: "Xem Nhiều",
        style: SectionStyle.GALLERY,
        viewMoreLink: {request: {page: 1, sort: {id: "viewCount"}}},
    },
    {
        id: "recentDate",
        title: "Cập Nhật Gần Đây",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: "recentDate"}}},
    },
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "recentDate",
        title: "Ngày cập nhật",
    },
    {
        id: "viewCount",
        title: "Lượt xem",
    },
    {
        id: "evaluationScore",
        title: "Lượt đánh giá",
    },
    {
        id: "followerCount",
        title: "Lượt theo dõi",
    },
    {
        id: "createdAt",
        title: "Truyện mới",
    }
];
