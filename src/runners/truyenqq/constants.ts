import {Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";


export const TRUYENQQ_DOMAIN = "https://truyenqqviet.com";
export const LOGIN = "/frontend/public/login"
export const PROFILE = "/quan-ly-tai-khoan.html"
export const FOLLOW = "Follow"
export const GET_FOLLOW_TOKEN = "GetFollowToken"


export const SESSION_COOKIE = "QiQiSession"
export const PREF_KEYS = {
    request: "request",
    domain: "domain",
    image_server: "image_server",
    comicId: "comic_id",
    comicToken: "comic_token"
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "Đang Cập Nhật": PublicationStatus.ONGOING,
    "Hoàn Thành": PublicationStatus.COMPLETED,
};

export const ADULT_TAGS = ["Mature", "Adult", "Smut"];
export const VERTICAL_TYPES = ["Manhwa", "Manhua", "Truyện Màu", "Huyền Huyễn", "Webtoon"];

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "suggested",
        title: "Truyện Hay",
        style: SectionStyle.INFO,
    },
    {
        id: "favorite",
        title: "Truyện Yêu Thích",
        style: SectionStyle.GALLERY,
    },
    {
        id: "top_month",
        title: "Top Tháng",
        style: SectionStyle.GALLERY,
    },
    {
        id: "latest",
        title: "Truyện Mới Cập Nhật",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, sort: {id: ""}}},
    },
];

export const PERSONAL_LISTS: Option[] = [
    {
        id: "followed",
        title: "Theo dõi"
    },
    {
        id: "read",
        title: "Lịch sử"
    }
]

export const SEARCH_SORTERS: Option[] = [
    {
        id: "2",
        title: "Ngày cập nhật",
    },
    {
        id: "0",
        title: "Ngày đăng",
    },
    {
        id: "4",
        title: "Lượt xem",
    }
];

export const IMAGE_SERVERS: Option[] = [
    {
        id: "server_1",
        title: "Server 1",
    },
    {
        id: "server_vip",
        title: "Server VIP",
    },
    {
        id: "server_vip_2",
        title: "Server VIP 2",
    }
];

export const DEFAULT_IMAGE_SERVER_DOMAIN = "i32.ntcdntempv26.com";
export const IMAGE_SERVER_DOMAIN: Record<string, string> = {
    "server_1": DEFAULT_IMAGE_SERVER_DOMAIN,
    "server_vip": "i.ntcdntempv26.com",
    "server_vip_2": "cdn.ntcdntempv3.com",
};
