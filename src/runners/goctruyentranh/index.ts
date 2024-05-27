import {
    CatalogRating,
    Chapter,
    ChapterData,
    Content,
    ContentSource,
    DirectoryConfig,
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
    UITextField,
} from "@suwatte/daisuke";
import {GOCTRUYENTRANH_DOMAIN, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target implements ContentSource,
    PageLinkResolver,
    ImageRequestHandler,
    RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "goctruyentranh",
        website: GOCTRUYENTRANH_DOMAIN,
        version: 0.1,
        name: "GocTruyenTranh",
        supportedLanguages: ["vi-vn"],
        thumbnail: "goctruyentranh.png",
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
        comicId: string,
        chapterId: string
    ): Promise<ChapterData> {
        return this.controller.getChapterData(comicId, chapterId);
    }

    async getTags(): Promise<Property[]> {
        const filters = await this.controller.getFilters();
        return filters.filter(f => f.id == "categories")
            .map(({id, title, options}) => ({
                id,
                title,
                tags: (options ?? []).map((v) => ({
                    id: v.id,
                    title: v.title,
                })),
            }))
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
            filters: await this.controller.getFilters()
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
                    header: "GocTruyenTranh Domain",
                    children: [
                        UITextField({
                            id: PREF_KEYS.domain,
                            title: "Domain name",
                            value: await GlobalStore.getDomain(),
                            didChange: GlobalStore.setDomain.bind(GlobalStore)
                        }),
                    ],
                },
            ],
        };
    }
}

