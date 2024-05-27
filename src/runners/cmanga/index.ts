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
import {CMANGA_DOMAIN, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";


export class Target
    implements ContentSource, PageLinkResolver, ImageRequestHandler, RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "cmanga",
        website: CMANGA_DOMAIN,
        version: 0.1,
        name: "CManga",
        supportedLanguages: ["vi-vn"],
        thumbnail: "cmanga.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.MIXED,
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

    async getChapters(_: string): Promise<Chapter[]> {
        return []
    }

    async getChapterData(
        _: string,
        chapterId: string
    ): Promise<ChapterData> {
        return this.controller.getChapterData(chapterId);
    }

    async getTags(): Promise<Property[]> {
        const genres = await this.controller.getGenres();
        return [{id: "genres", title: "Thể loại", tags: genres}]
    }

    // Directory
    getDirectory(request: DirectoryRequest): Promise<PagedResult> {
        return this.controller.getSearchResults(request);
    }

    async getDirectoryConfig(): Promise<DirectoryConfig> {
        return {
            filters: await this.controller.getFilters(),
            sort: {
                options: SEARCH_SORTERS,
                default: {id: ""}
            },
        };
    }

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
        };
    }

    async getPreferenceMenu(): Promise<Form> {
        return {
            sections: [
                {
                    header: "CManga Domain",
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
