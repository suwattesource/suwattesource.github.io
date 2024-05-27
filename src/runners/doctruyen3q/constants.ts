import {Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";


export const DOCTRUYEN3Q_DOMAIN = "https://doctruyen3qvn.com";
export const LIST_CHAPTER_BY_STORY_ID = "/Story/ListChapterByStoryID"
export const LOAD_MANGA_BY_AUTHOR = "/ajax/Author/AjaxLoadMangaByAuthor"
export const LOAD_MANGA_BY_TRANSLATE_TEAM = "/ajax/TranslateTeam/AjaxLoadMangaByTranslateTeam"
export const LOAD_MANGA_CREATED = "/Account/AjaxLoadMangaCreated"
export const LOAD_MANGA_BY_CATEGORY = "/ajax/Category/AjaxLoadMangaByCategory"

export const PREF_KEYS = {
    cache_cover: "cover",
    request: "request",
    domain: "domain",
}

export const STATUS_KEYS: Record<string, PublicationStatus> = {
    "Đang tiến hành": PublicationStatus.ONGOING,
    "Đã hoàn thành": PublicationStatus.COMPLETED,
    "Tạm ngưng": PublicationStatus.HIATUS,
};

export const ADULT_TAGS = ["Mature", "Adult", "Smut"];
export const VERTICAL_TYPES = ["Manhwa", "Manhua", "Truyện Màu", "Webtoon"];

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Truyện nổi bật",
        style: SectionStyle.INFO,
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
