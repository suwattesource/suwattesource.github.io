import {
  Option,
  PageSection,
  PublicationStatus,
  SectionStyle,
} from "@suwatte/daisuke";


export const NETTRUYEN_DOMAIN = "https://nettruyenbb.com";
export const REQUEST_CACHE_KEY = "request"

export const STATUS_KEYS: Record<string, PublicationStatus> = {
  "Đang tiến hành": PublicationStatus.ONGOING,
  "Hoàn thành": PublicationStatus.COMPLETED,
};

export const ADULT_TAGS = ["Mature", "Adult", "Smut"];
export const VERTICAL_TYPES = ["Manhwa", "Manhua"];

export const HOME_PAGE_SECTIONS: PageSection[] = [
  {
    id: "trending",
    title: "Truyện đề cử",
    style: SectionStyle.GALLERY,
  },
  {
    id: "latest",
    title: "Truyện mới cập nhật",
    style: SectionStyle.PADDED_LIST,
    viewMoreLink: { request: { page: 1, sort: { id: "" } } },
  },
];

export const SEARCH_SORTERS: Option[] = [
  {
    id: "",
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

