import {DirectoryFilter, FilterType, Option, PageSection, SectionStyle} from "@suwatte/daisuke";

export const HENTAIVN_DOMAIN = "https://hentaihvn.tv";

export const PREF_KEYS = {
    cache_request: "request",
    exclude_categories: "exclude_categories",
    domain: "domain",
    image_server: "image_server"
};

export const VERTICAL_TYPES = ["Manhwa", "Webtoon"];

export const COMIC_TYPES = ["Comic"];


export const SEARCH_SORTERS: Option[] = [
    {
        id: "view0",
        title: "Mới nhất",
    },
    {
        id: "view5",
        title: "Top like ngày",
    },
    {
        id: "view2",
        title: "Top like tuần",
    },
    {
        id: "view3",
        title: "Top like tháng",
    },
    {
        id: "view",
        title: "Top like all",
    },
    {
        id: "view4",
        title: "Thịnh hành",
    },
];

export const DEFAULT_FILTERS: DirectoryFilter[] = [
    {
        id: "manga_name",
        title: "Tên truyện cần tìm",
        subtitle: "Không ghi cũng được",
        type: FilterType.TEXT,
    },
    {
        id: "doujinshi",
        title: "Doujinshi bộ nào",
        subtitle: `Có thể để trống`,
        type: FilterType.TEXT,
    },
    {
        id: "character",
        title: "Nhân vật gì",
        subtitle: "Có thể để trống",
        type: FilterType.TEXT,
    },
];

export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "trending",
        title: "Thịnh hành",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "hot",
        title: "Tiêu điểm",
        style: SectionStyle.GALLERY,
    },
    {
        id: "random_suggestion",
        title: "Gợi ý ngẫu nhiên",
        style: SectionStyle.DEFAULT,
    },
    {
        id: "recommend",
        title: "Truyện đề cử",
        subtitle: "Chỉ có truyện từng đạt top 1 Thịnh hành mới nhận được đề cử từ hệ thống.",
        style: SectionStyle.GALLERY,
        viewMoreLink: {request: {page: 1, configID: "top-de-cu.html", sort: {id: ""}}}
    },
    {
        id: "new_upload",
        title: "Truyện mới đăng",
        style: SectionStyle.INFO,
    },
    {
        id: "top_liked_daily",
        title: "Top like ngày",
        style: SectionStyle.NAVIGATION_LIST,
    },
    {
        id: "top_liked_all",
        title: "Top like toàn thời gian",
        style: SectionStyle.INFO,
        viewMoreLink: {request: {page: 1, configID: "top-luot-xem.html", sort: {id: ""}}},
    },
    {
        id: "new_update",
        title: "Mới cập nhật",
        style: SectionStyle.PADDED_LIST,
        viewMoreLink: {request: {page: 1, configID: "new_update", sort: {id: ""}}},
    },
];

export const DEFAULT_EXCLUDED_TAGS = ["/the-loai-55-guro.html", "/the-loai-134-scat.html", "/the-loai-96-yaoi.html"]

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

export const REPLACEABLE_IMAGE_SERVER_DOMAIN = "evvdsfgefdszihfdx.hentaivn.tv"
export const DEFAULT_IMAGE_SERVER_DOMAIN = "i3.hhentai.net";
export const IMAGE_SERVER_DOMAIN: Record<string, string> = {
    "server_1": DEFAULT_IMAGE_SERVER_DOMAIN,
    "server_2": "cdns.hhentai.net",
};
