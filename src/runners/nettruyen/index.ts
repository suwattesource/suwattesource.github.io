import {
  BooleanState,
  CatalogRating,
  Chapter,
  ChapterData,
  Content,
  ContentSource,
  DirectoryConfig,
  DirectoryRequest,
  Form,
  NetworkRequest,
  PageLink,
  PageLinkResolver,
  PageSection,
  PagedResult,
  ResolvedPageSection,
  RunnerInfo,
  RunnerPreferenceProvider,
  Property,
  UITextField,
} from "@suwatte/daisuke";
import { ADULT_TAGS, NETTRUYEN_DOMAIN, SEARCH_SORTERS } from "./constants";
import { Controller } from "./controller";
import { Store } from "./store";

export class Target
  implements ContentSource, PageLinkResolver {
  info: RunnerInfo = {
    id: "nettruyen",
    website: NETTRUYEN_DOMAIN,
    version: 0.4,
    name: "NetTruyen",
    supportedLanguages: ["VI"],
    thumbnail: "nettruyen.png",
    minSupportedAppVersion: "6.0",
    rating: CatalogRating.SAFE,
  };
  private controller = new Controller();
  private store = new Store();


  async headers(): Promise<Record<string, string>> {
    return {
      Referer: await this.store.domain() + "/",
    };
  }

  // Core
  async getContent(contentId: string): Promise<Content> {
    const domain = await this.store.domain()
    return this.controller.getContent(domain, contentId);
  }
  async getChapters(contentId: string): Promise<Chapter[]> {
    const domain = await this.store.domain()
    return this.controller.getChapters(domain, contentId);
  }
  async getChapterData(
    contentId: string,
    chapterId: string
  ): Promise<ChapterData> {
    return this.controller.getChapterData(contentId, chapterId);
  }

  async getTags?(): Promise<Property[]> {
    const domain = await this.store.domain()
    const filters = await this.controller.getFilters(domain);
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
  async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
    const domain = await this.store.domain()
    return this.controller.getSearchResults(request, domain);
  }

  async getDirectoryConfig(): Promise<DirectoryConfig> {
    const domain = await this.store.domain()
    return {
      sort: {
        options: SEARCH_SORTERS,
        canChangeOrder: true,
        default: {
          id: "",
          ascending: false,
        },
      },
      filters: await this.controller.getFilters(domain),
    };
  }

  // Page Links
  async getSectionsForPage(link: PageLink): Promise<PageSection[]> {
    const domain = await this.store.domain()
    return this.controller.buildHomePageSections(domain);
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
        ...await this.headers(),
      },
    }
  }

  async getSetupMenu() {
    return {
      sections: [
        {
          header: "NetTruyen Domain",
          children: [
            UITextField({
              id: "domain",
              title: "Domain name",
              value: (await this.store.domain()) ?? "",
            }),
          ],
        },
      ],
    };
  }

  async validateSetupForm({ domain }: { domain: string }) {
    await ObjectStore.set("domain", domain);
  }

  async isRunnerSetup(): Promise<BooleanState> {
    return {
      state: !!(await this.store.domain()),
    };
  }
}

