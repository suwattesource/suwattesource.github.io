import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  PagedResult,
  RunnerInfo,
  NetworkRequest,
  Property,
} from "@suwatte/daisuke";
import { IMHENTAI_DOMAIN, SEARCH_SORTERS } from "./constants";
import { Controller } from "./controller";

export class Target
  implements ContentSource {
  info: RunnerInfo = {
    id: "imhentai",
    website: "https://imhentai.xxx",
    version: 0.8,
    name: "IMHentai",
    supportedLanguages: ["EN"],
    thumbnail: "imhentai.png",
    minSupportedAppVersion: "6.0",
    rating: CatalogRating.NSFW,
  };
  private controller = new Controller();

  headers(): Record<string, string> {
    return {
      Referer: IMHENTAI_DOMAIN + "/",
    };
  }

  // Core
  async getContent(contentId: string): Promise<Content> {
    return this.controller.getContent(contentId);
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    return this.controller.getChapters(contentId);
  }
  async getChapterData(
    contentId: string,
    chapterId: string
  ): Promise<ChapterData> {
    return this.controller.getChapterData(contentId, chapterId);
  }

  async getTags?(): Promise<Property[]> {
    const filters = await this.controller.getFilters();
    return filters
      .map(({ id, title, options }) => ({
        id,
        title,
        tags: (options ?? []).map((v) => ({
          id: v.id,
          title: v.title,
        })),
      }))
      .filter((v) => v.tags.length != 0);
  }

  // Directory
  getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    return this.controller.getSearchResults(request);
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    return {
      sort: {
        options: SEARCH_SORTERS,
        canChangeOrder: true,
        default: {
          id: "lt",
          ascending: false,
        },
      },
      filters: await this.controller.getFilters(),
    };
  }


  async willRequestImage(imageURL: string): Promise<NetworkRequest> {
    return this.imageRequest(imageURL);
  }

  async imageRequest(url: string): Promise<NetworkRequest> {
    return {
      url,
      headers: {
        ...this.headers(),
      },
    };
  }
}

