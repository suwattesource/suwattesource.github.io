import {
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  Form,
  PageLink,
  PageLinkResolver,
  PageSection,
  PagedResult,
  ResolvedPageSection,
  RunnerInfo,
  RunnerPreferenceProvider,
  NetworkRequest,
  Property,
} from "@suwatte/daisuke";
import { ADULT_TAGS, NETTRUYEN_DOMAIN, SEARCH_SORTERS } from "./constants";
import { Controller } from "./controller";

export class Target
  implements ContentSource, PageLinkResolver, RunnerPreferenceProvider {
  info: RunnerInfo = {
    id: "nettruyen",
    website: "https://nettruyenbb.com",
    version: 0.2,
    name: "NetTruyen",
    supportedLanguages: ["VI"],
    thumbnail: "nettruyen.png",
    minSupportedAppVersion: "6.0",
    rating: CatalogRating.SAFE,
  };
  private controller = new Controller();

  headers(): Record<string, string> {
    return {
      Referer: NETTRUYEN_DOMAIN + "/",
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
          nsfw: ADULT_TAGS.includes(v.title),
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
          id: "",
          ascending: false,
        },
      },
      filters: await this.controller.getFilters(),
    };
  }

  // Page Links
  async getSectionsForPage(link: PageLink): Promise<PageSection[]> {
    const key = link.id;
    if (key !== "home") throw new Error("invalid page.");
    return this.controller.buildHomePageSections();
  }

  resolvePageSection(
    _link: PageLink,
    _sectionKey: string
  ): Promise<ResolvedPageSection> {
    throw new Error("already resolved");
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

  // Preferences
  async getPreferenceMenu(): Promise<Form> {
    return {
      sections: [],
    };
  }
}

