import { DirectoryRequest, PageSection, PagedResult, FilterType } from "@suwatte/daisuke";
import {
  IMHENTAI_DOMAIN,
} from "./constants";
import { Parser, isLastPage } from "./parser";

export class Controller {
  private client = new NetworkClient();
  private parser = new Parser();

  async getSearchResults(request: DirectoryRequest): Promise<PagedResult> {
    const searchUrl = this.createSearchURL(request)
    const response = await this.client.get(searchUrl);
    const html = response.data;
    const results = this.parser.parseSearch(html);
    return {
      results,
      isLastPage: isLastPage(html)
    };
  }

  async getFilters() {
    const response = await this.client.get(`${IMHENTAI_DOMAIN}/tim-truyen-nang-cao`);
    const html = response.data;
    return this.parser.filters(html);
  }

  createSearchURL(request: DirectoryRequest): string {
    const { query, tag, filters, page, sort } = request;
    const search = {
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

    if (sort) {
      search.lt = 0
      search[sort.id as keyof typeof search] = 1
    }

    const param = `apply=Search&${Object.entries(search).map(([key, value]) => `${key}=${value}`).join('&')}`;
    return `${IMHENTAI_DOMAIN}/search/?key=&${param}&page=${page}`;
  }

  // Content
  async getContent(id: string) {
    const response = await this.client.get(`${IMHENTAI_DOMAIN}/gallery/${id}`);
    const html = response.data;
    return this.parser.content(html, id);
  }

  // Chapters
  async getChapters(id: string) {
    const response = await this.client.get(`${IMHENTAI_DOMAIN}/gallery/${id}`);
    const html = response.data;
    return this.parser.chapters(html);
  }

  async getChapterData(contentId: string, chapterId: string) {
    const url = `${IMHENTAI_DOMAIN}/gallery/${contentId}`;
    const response = await this.client.get(url);
    return this.parser.chapterData(response.data);
  }
}
