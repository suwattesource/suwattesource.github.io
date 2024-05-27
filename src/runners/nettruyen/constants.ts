import {Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";


export const NETTRUYEN_DOMAIN = "https://nettruyenvv.com";
export const NETTRUYEN_SEARCH_SUGGESTION_URL = "https://www.nettruyenvv.com/Comic/Services/SuggestSearch.ashx"

export const CHECK_AUTH = "CheckAuth"
export const GET_FOLLOWED_COMICS = "GetFollowedPageComics"
export const GET_READ_COMICS = "GetReadComics"
export const CHAPTER_LOADED = "ChapterLoaded"
export const READ = "Read"
export const FOLLOW = "Follow"
export const GET_FOLLOW_TOKEN = "GetFollowToken"


export const AUTH_COOKIE = ".ASPXAUTH"
export const PREF_KEYS = {
    request: "request",
    domain: "domain",
    image_server: "image_server",
    comicId: "comic_id",
    comicToken: "comic_token"
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "Đang tiến hành": PublicationStatus.ONGOING,
    "Hoàn thành": PublicationStatus.COMPLETED,
};

export const ADULT_TAGS = ["Mature", "Adult", "Smut"];
export const VERTICAL_TYPES = ["Manhwa", "Manhua", "Truyện Màu"];

export const MANGA_TYPES = ["Manga"];


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Truyện đề cử",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "top_month",
        title: "Top tháng",
        style: SectionStyle.GALLERY,
    },
    {
        id: "latest",
        title: "Truyện mới cập nhật",
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
        id: "0",
        title: "Ngày cập nhật",
    },
    {
        id: "15",
        title: "Truyện mới",
    },
    {
        id: "10",
        title: "Xem nhiều nhất",
    },
    {
        id: "11",
        title: "Xem nhiều nhất tháng",
    },
    {
        id: "12",
        title: "Xem nhiều nhất tuần",
    },
    {
        id: "13",
        title: "Xem nhiều nhất hôm nay",
    },
    {
        id: "20",
        title: "Theo dõi nhiều nhất",
    },
    {
        id: "25",
        title: "Bình luận nhiều nhất",
    },
    {
        id: "30",
        title: "Số chapter nhiều nhất",
    },
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
