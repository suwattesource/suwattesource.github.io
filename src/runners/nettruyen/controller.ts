import { DirectoryRequest, PageSection, PagedResult, FilterType } from "@suwatte/daisuke";
import { load } from "cheerio";
import { each } from "cheerio/lib/api/traversing";
import {
  HOME_PAGE_SECTIONS,
  NETTRUYEN_DOMAIN,
} from "./constants";
import { Parser } from "./parser";
import { isNumber } from "./utils";

export class Controller {
  private client = new NetworkClient();
  private parser = new Parser();

  async buildHomePageSections() {
    const { data: response } = await this.client.get(NETTRUYEN_DOMAIN);

    const out: PageSection[] = [];
    for (const section of HOME_PAGE_SECTIONS) {
      const items = this.parser.homepageSection(section.id, load(response));
      out.push({ ...section, items });
    }
    return out;
  }

  async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
    const searchUrl = this.createSearchURL(request)
    const response = await this.client.get(searchUrl);
    const html = response.data;
    const results = this.parser.parseSearch(html);
    return {
      results,
      isLastPage: this.isLastPage(html),
    };
  }

  async getFilters() {
    const response = await this.client.get(`${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao`);
    const html = response.data;
    return this.parser.filters(html);
  }

  createSearchURL(request: DirectoryRequest): string {
    const { query, tag, sort, filters, page } = request;

    let sort_id = ""
    if (sort) {
      sort_id = sort.id
    }
    if (query) {
      const postfix = encodeURI(`?keyword=${query}&page=${page}`)
      return `${NETTRUYEN_DOMAIN}/tim-truyen${postfix}`
    }

    if (tag) {
      switch (tag.propertyId) {
        case "genres": {
          if (isNumber(tag.tagId)) {
            return `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao?genres=${tag.tagId}&page=${page}`;
          }
          return `${NETTRUYEN_DOMAIN}/tim-truyen/${tag.tagId}?sort=${sort_id}&page=${page}`
        }
        case "authors": {
          return `${NETTRUYEN_DOMAIN}/tim-truyen?${tag.tagId}&page=${page}`
        }
        case "numchap": {
          return `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao?minchapter=${tag.tagId}&page=${page}`
        }
        case "status": {
          return `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao?status=${tag.tagId}&page=${page}`
        }
        case "gender": {
          return `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao?gender=${tag.tagId}&page=${page}`
        }
        case "sort": {
          return `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao?sort=${tag.tagId}&page=${page}`
        }
      }
    }

    if (filters) {
      const search = {
        genres: '',
        exgenres: '',
        gender: "-1",
        status: "-1",
        minchapter: "1",
        sort: "0",
      };

      const includeGenres = filters.genres?.included ?? [];
      const excludeGenres = filters.genres?.excluded ?? [];

      search.genres = includeGenres.join(",");
      search.exgenres = excludeGenres.join(",");
      search.minchapter = filters.numchap ?? "1"
      search.gender = filters.gender ?? "-1"
      search.status = filters.status ?? "-1"
      search.sort = filters.sort ?? "0"

      const paramExgenres = search.exgenres ? `&notgenres=${search.exgenres}` : '';

      const url = `${NETTRUYEN_DOMAIN}/tim-truyen-nang-cao`;
      const param = `?genres=${search.genres}${paramExgenres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${search.sort}&page=${page}`;
      return url + param
    }
    return `${NETTRUYEN_DOMAIN}/tim-truyen?sort=${sort_id}&page=${page}`
  }

  isLastPage = (html: string): boolean => {
    const $ = load(html)
    const current = $('ul.pagination > li.active > a').text();
    let total = $('ul.pagination > li.PagerSSCCells:last-child').text();

    if (current) {
      total = total ?? '';
      return (+total) === (+current);
    }
    return true;
  }

  // Content
  async getContent(id: string) {
    const response = await this.client.get(`${NETTRUYEN_DOMAIN}/truyen-tranh/${id}`);
    const html = response.data;
    return this.parser.content(html, id);
  }
  // Chapters
  async getChapters(id: string) {
    const response = await this.client.get(`${NETTRUYEN_DOMAIN}/truyen-tranh/${id}`);
    const html = response.data;
    return this.parser.chapters(html);
  }
  async getChapterData(_contentId: string, chapterId: string) {
    const url = `${NETTRUYEN_DOMAIN}/truyen-tranh/${chapterId}`;
    const response = await this.client.get(url);
    return this.parser.chapterData(response.data);
  }
}
