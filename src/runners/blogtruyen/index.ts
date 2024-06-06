import {
    CatalogRating,
    Chapter,
    ChapterData,
    Content,
    ContentSource,
    DirectoryConfig,
    DirectoryFilter,
    DirectoryRequest,
    Form,
    ImageRequestHandler,
    NetworkRequest,
    PagedResult,
    PageLink,
    PageLinkResolver,
    PageSection,
    Property,
    ResolvedPageSection,
    RunnerInfo,
    RunnerPreferenceProvider,
    UIPicker,
} from "@suwatte/daisuke";
import {BLOGTRUYEN_DOMAIN, DOMAIN_OPTIONS, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target implements ContentSource,
    PageLinkResolver,
    ImageRequestHandler,
    RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "blogtruyen",
        website: BLOGTRUYEN_DOMAIN,
        version: 1.1,
        name: "BlogTruyen",
        supportedLanguages: ["vi-vn"],
        thumbnail: "blogtruyen.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.SAFE,
    };
    private controller = new Controller();

    async headers(): Promise<Record<string, string>> {
        return {
            Referer: await GlobalStore.getDomain() + "/",
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
        _: string,
        chapterId: string
    ): Promise<ChapterData> {
        return this.controller.getChapterData(chapterId);
    }

    async getTags(): Promise<Property[]> {
        const filters = await this.controller.getFilters();
        const categories: DirectoryFilter | undefined = filters.pop()
        return [{
            id: "categories",
            title: "Thể loại",
            tags: categories?.options?.map(category => ({id: category.title, title: category.title})) || []
        }]
    }

    // Directory
    async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
        return this.controller.getSearchResults(request);
    }

    async getDirectoryConfig(): Promise<DirectoryConfig> {
        return {
            sort: {
                options: SEARCH_SORTERS,
                canChangeOrder: false,
                default: {
                    id: "",
                    ascending: false,
                },
            },
            filters: await this.controller.getFilters(),
        };
    }

    // Page Links
    async getSectionsForPage(_: PageLink): Promise<PageSection[]> {
        return this.controller.buildHomePageSections();
    }

    resolvePageSection(
        _link: PageLink,
        _sectionKey: string
    ): Promise<ResolvedPageSection> {
        throw new Error("already resolved");
    }


    async willRequestImage(url: string): Promise<NetworkRequest> {
        return {
            url,
            headers: {
                ...await this.headers(),
            },
        }
    }

    async getPreferenceMenu(): Promise<Form> {
        return {
            sections: [
                {
                    header: "BlogTruyen Domain",
                    children: [
                        UIPicker(
                            {
                                id: PREF_KEYS.domain,
                                title: "Domain name",
                                options: DOMAIN_OPTIONS,
                                value: await GlobalStore.getDomain(),
                                didChange: GlobalStore.setDomain.bind(GlobalStore)
                            }
                        ),
                    ],
                },
            ],
        };
    }
}

