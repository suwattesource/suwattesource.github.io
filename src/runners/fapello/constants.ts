import {Option, PageSection, SectionStyle,} from "@suwatte/daisuke";


export const FAPELLO_DOMAIN = "https://fapello.com";


export const PREF_KEYS = {
    request: "request",
    domain: "domain",
    cache_chapter_images: "chapter_images",
    number_of_images_per_chapter: "number_of_images_per_chapter",
}


export const HOME_PAGE_SECTIONS: PageSection[] = [
    {
        id: "top-likes",
        title: "Top Likes",
        style: SectionStyle.GALLERY,
    },
    {
        id: "top-followers",
        title: "Top Followers",
        style: SectionStyle.GALLERY,
    },
    {
        id: "trending",
        title: "Trending",
        style: SectionStyle.GALLERY,
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
