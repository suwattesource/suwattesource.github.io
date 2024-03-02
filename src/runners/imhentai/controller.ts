import { DirectoryRequest, PagedResult } from "@suwatte/daisuke";
import {
  FILTERS,
  IMHENTAI_DOMAIN,
  REQUEST_CACHE_KEY,
} from "./constants";
import { Parser } from "./parser";
import { Cache } from "./cache";
import { load } from "cheerio";

export class Controller {
  private client = new NetworkClient();
  private parser = new Parser();
  private cache = new Cache<DirectoryRequest>();

  async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
    const searchUrl = this.createSearchURL(request)
    const response = await this.client.get(searchUrl);
    const $ = load(response.data);
    const results = await this.parser.getSearchResults($);
    return {
      results,
      isLastPage: this.parser.isLastPage($)
    };
  }

  async getFilters() {
    return FILTERS
  }

  createSearchURL(request: DirectoryRequest): string {
    const searchOptions = {
      lt: 0,      // latest
      pp: 0,      // popular
      dl: 0,      // downladed
      tr: 0,      // top rated
      en: 1,      // english
      jp: 1,      // japanese
      es: 1,      // spanish
      fr: 1,      // french
      kr: 1,      // korean
      de: 1,      // german
      ru: 1,      // russian
      m: 1,       // manga
      d: 1,       // doujinshi
      w: 1,       // western
      i: 1,       // image set
      a: 1,       // artist cg
      g: 1,       // game cg
    };

    let keyword = ""
    let baseUrl = `${IMHENTAI_DOMAIN}/search`

    const { sort, page } = request
    if (sort && sort.id != "") {
      request = this.cache.get(REQUEST_CACHE_KEY) ?? request
      searchOptions[sort.id as keyof typeof searchOptions] = 1
    }

    const { filters, tag, query } = request;

    if (!filters && !tag && !query) {
      this.cache.remove(REQUEST_CACHE_KEY)
    }
    if (filters || tag || query) {
      this.cache.set(REQUEST_CACHE_KEY, request)
    }

    if (filters) {
      keyword = filters.term ?? keyword
      const categories = filters.category ?? []
      const languages = filters.language ?? []
      for (const category of categories) {
        searchOptions[category as keyof typeof searchOptions] = 0
      }
      for (const language of languages) {
        searchOptions[language as keyof typeof searchOptions] = 0
      }

      if (filters.advsearch) {
        baseUrl = `${IMHENTAI_DOMAIN}/advsearch`
        keyword = keyword.replace(/("[^"]+")/g, match => {
          let words = match.slice(1, -1).toLowerCase().split(' ');
          words = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
          return '"' + words.join(' ') + '"';
        });
      }
    }

    if (tag) {
      baseUrl = `${IMHENTAI_DOMAIN}${tag.tagId}/`
      if (sort && sort.id == "pp") {
        baseUrl += "popular/"
      }
      return `${baseUrl}?page=${page}`;
    }

    if (query) {
      keyword = query
    }

    keyword = encodeURIComponent(keyword)
    const param = `apply=Search&${Object.entries(searchOptions).map(([key, value]) => `${key}=${value}`).join('&')}`;
    return `${baseUrl}/?key=${keyword}&${param}&page=${page}`;
  }

  // Content
  async getContent(id: string) {
    const response = await this.client.get(`${IMHENTAI_DOMAIN}/gallery/${id}`);
    const $ = load(response.data);
    return this.parser.getContent($, id);
  }

  // Chapters
  async getChapters(id: string) {
    const response = await this.client.get(`${IMHENTAI_DOMAIN}/gallery/${id}`);
    const $ = load(response.data);
    return this.parser.getChapters($);
  }

  async getChapterData(contentId: string, chapterId: string) {
    const url = `${IMHENTAI_DOMAIN}/gallery/${contentId}`;
    const response = await this.client.get(url);
    const $ = load(response.data);
    return this.parser.getChapterData($);
  }
}
