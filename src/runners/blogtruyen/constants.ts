import {DirectoryFilter, FilterType, Option, PageSection, PublicationStatus, SectionStyle,} from "@suwatte/daisuke";


export const BLOGTRUYEN_DOMAIN = "https://blogtruyen.vn";
export const BLOGTRUYENMOI_DOMAIN = "https://blogtruyenmoi.com";

export const LOAD_LIST_MANGA = "/ajax/Search/AjaxLoadListManga"
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

export const VERTICAL_TYPES = ["Manhwa", "Manhua", "Tu chân - tu tiên", "Webtoon"];
export const COMIC_TYPES = ["VnComic"];


export const DOMAIN_OPTIONS: Option[] = [
    {
        title: BLOGTRUYEN_DOMAIN,
        id: BLOGTRUYEN_DOMAIN,
    },
    {
        title: BLOGTRUYENMOI_DOMAIN,
        id: BLOGTRUYENMOI_DOMAIN,
    },
];

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Tiêu điểm truyện hôm nay",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "top-hot",
        title: "Truyện hot",
        style: SectionStyle.GALLERY,
    },
    {
        id: "top-week",
        title: "Top lượt xem tuần",
        style: SectionStyle.NAVIGATION_LIST,
    },
    {
        id: "new-manga",
        title: "Truyện mới đăng",
        style: SectionStyle.INFO,
    },
    {
        id: "new-update",
        title: "Truyện mới cập nhật",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, configID: "new_update", sort: {id: ""}}},
    }
];

export const STATUSES: Option[] = [
    {
        id: "0",
        title: "Sao cũng được",
    },
    {
        id: "1",
        title: "Đang tiến hành",
    },
    {
        id: "2",
        title: "Đã hoàn thành",
    },
    {
        id: "3",
        title: "Tạm ngưng",
    },
];

export const DEFAULT_FILTERS: DirectoryFilter[] = [
    {
        id: "keyword",
        title: "Từ khoá",
        subtitle: "Nhập từ khoá",
        type: FilterType.TEXT,
    },
    {
        id: "author",
        title: "Tác giả",
        subtitle: `Tên tác giả`,
        type: FilterType.TEXT,
    },
    {
        id: "translator",
        title: "Nhóm dịch",
        subtitle: "Tên nhóm dịch",
        type: FilterType.TEXT,
    },
    {
        id: "status",
        title: "Trạng thái",
        type: FilterType.SELECT,
        options: STATUSES
    },
];

export const SEARCH_SORTERS: Option[] = [
    {
        id: "5",
        title: "Thời gian",
    },
    {
        id: "1",
        title: "Tên truyện",
    },
    {
        id: "2",
        title: "Số chương",
    },
    {
        id: "3",
        title: "Lượt xem",
    },
    {
        id: "4",
        title: "Bình luận",
    }
];
