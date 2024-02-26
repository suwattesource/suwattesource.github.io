import {
  DirectoryFilter,
  FilterType,
  Option,
  PageSection,
  PublicationStatus,
  SectionStyle,
} from "@suwatte/daisuke";
import { capitalize } from "lodash";


export const NETTRUYEN_DOMAIN = "https://nettruyenbb.com";

const STATUSES = ["ongoing", "complete"];

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


export const SORT_KEYS: Record<string, string> = {
  views_all: "v",
  views_monthly: "vm",
  recent: "lt",
  alphabetically: "s",
};

export const TAG_PREFIX = {
  publication: "p_status",
  scanlation: "s_status",
  type: "type",
  year: "released",
  author: "author",
  translation: "translation",
  genres: "genres",
};

export const SEARCH_SORTERS: Option[] = [
  {
    id: "10",
    title: "Top all",
  },
  {
    id: "11",
    title: "Top tháng",
  },
  {
    id: "12",
    title: "Top tuần",
  },
  {
    id: "13",
    title: "Top ngày",
  },
  {
    id: "",
    title: "Ngày cập nhật",
  },
  {
    id: "15",
    title: "Truyện mới",
  },
  {
    id: "25",
    title: "Bình luận",
  },
  {
    id: "20",
    title: "Theo dõi",
  },
  {
    id: "30",
    title: "Số chapter",
  },
];

export const DEFAULT_FILTERS: DirectoryFilter[] = [
  {
    id: TAG_PREFIX.publication,
    title: "Publication Status",
    type: FilterType.MULTISELECT,
    options: STATUSES.map((id) => ({ id, title: capitalize(id) })),
  },
  {
    id: TAG_PREFIX.scanlation,
    title: "Scan Status",
    options: STATUSES.map((id) => ({ id, title: capitalize(id) })),
    type: FilterType.MULTISELECT,
  },
  {
    id: TAG_PREFIX.translation,
    title: "Official Translation Only",
    type: FilterType.TOGGLE,
  },
];
