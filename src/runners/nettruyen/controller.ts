import { DirectoryRequest, PageSection, PagedResult } from "@suwatte/daisuke";
import { load } from "cheerio";
import {
  HOME_PAGE_SECTIONS,
  REQUEST_CACHE_KEY,
} from "./constants";
import { Parser } from "./parser";
import { Cache, isNumber } from "./utils";

export class Controller {
  private client = new NetworkClient();
  private parser = new Parser();
  private cache = new Cache<DirectoryRequest>();

  async buildHomePageSections(domain: string) {
    const { data: response } = await this.client.get(domain);

    const out: PageSection[] = [];
    const $ = load(response)
    for (const section of HOME_PAGE_SECTIONS) {
      const items = this.parser.getHomepageSection($, section.id);
      out.push({ ...section, items });
    }
    return out;
  }

  async getSearchResults(request: DirectoryRequest, domain: string): Promise<PagedResult> {
    const searchUrl = this.createSearchURL(request, domain)
    const response = await this.client.get(searchUrl);
    const $ = load(response.data);
    const results = this.parser.getSearchResults($);
    return {
      results,
      isLastPage: this.parser.isLastPage($),
    };
  }

  async getFilters(domain: string) {
    const response = await this.client.get(`${domain}/tim-truyen-nang-cao`);
    const $ = load(response.data);
    return this.parser.getFilters($);
  }

  createSearchURL(request: DirectoryRequest, domain: string): string {
    const { sort, page } = request;

    let sort_id = sort?.id
    if (sort_id) {
      request = this.cache.get(REQUEST_CACHE_KEY) ?? request
    }
    const { query, filters, tag } = request
    if (!query && !filters && !tag) {
      this.cache.remove(REQUEST_CACHE_KEY)
    }
    if (query || filters || tag) {
      this.cache.set(REQUEST_CACHE_KEY, request)
    }

    if (query) {
      const postfix = encodeURI(`?keyword=${query}&page=${page}`)
      return `${domain}/tim-truyen${postfix}`
    }

    if (tag) {
      switch (tag.propertyId) {
        case "genres": {
          if (isNumber(tag.tagId)) {
            return `${domain}/tim-truyen-nang-cao?genres=${tag.tagId}&sort=${sort_id}&page=${page}`;
          }
          return `${domain}/tim-truyen/${tag.tagId}?sort=${sort_id}&page=${page}`
        }
        case "authors": {
          return `${domain}/tim-truyen?${tag.tagId}&page=${page}`
        }
        case "numchap": {
          return `${domain}/tim-truyen-nang-cao?minchapter=${tag.tagId}&sort=${sort_id}&page=${page}`
        }
        case "status": {
          return `${domain}/tim-truyen-nang-cao?status=${tag.tagId}&sort=${sort_id}&page=${page}`
        }
        case "gender": {
          return `${domain}/tim-truyen-nang-cao?gender=${tag.tagId}&sort=${sort_id}&page=${page}`
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
      };

      const includeGenres = filters.genres?.included ?? [];
      const excludeGenres = filters.genres?.excluded ?? [];

      search.genres = includeGenres.join(",");
      search.exgenres = excludeGenres.join(",");
      search.minchapter = filters.numchap ?? "1"
      search.gender = filters.gender ?? "-1"
      search.status = filters.status ?? "-1"

      const paramExgenres = search.exgenres ? `&notgenres=${search.exgenres}` : '';

      const url = `${domain}/tim-truyen-nang-cao`;
      const param = `?genres=${search.genres}${paramExgenres}&gender=${search.gender}&status=${search.status}&minchapter=${search.minchapter}&sort=${sort_id}&page=${page}`;
      return url + param
    }
    return `${domain}/tim-truyen?sort=${sort_id}&page=${page}`
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
  async getContent(domain: string, id: string) {
    const response = await this.client.get(`${domain}/truyen-tranh/${id}`);
    const $ = load(response.data);
    const webUrl = `${domain}/truyen-tranh/${id}`
    return this.parser.getContent($, webUrl);
  }
  // Chapters
  async getChapters(domain: string, id: string) {
    const response = await this.client.get(`${domain}/truyen-tranh/${id}`);
    const $ = load(response.data);
    return this.parser.getChapters($);
  }
  async getChapterData(domain: string, chapterId: string) {
    const url = `${domain}/truyen-tranh/${chapterId}`;
    const response = await this.client.get(url);
    const $ = load(response.data);
    return this.parser.getChapterData($);
  }
}
