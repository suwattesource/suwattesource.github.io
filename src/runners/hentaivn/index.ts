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
    UIMultiPicker,
    UIPicker,
    UITextField,
} from "@suwatte/daisuke";
import {HENTAIVN_DOMAIN, IMAGE_SERVERS, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target
    implements ContentSource, RunnerPreferenceProvider, PageLinkResolver, ImageRequestHandler {
    info: RunnerInfo = {
        id: "hentaivn",
        website: HENTAIVN_DOMAIN,
        version: 1.1,
        name: "HentaiVN",
        supportedLanguages: ["vi-vn"],
        thumbnail: "hentaivn.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.NSFW,
    };
    private controller = new Controller();


    async headers(): Promise<Record<string, string>> {
        return {
            Referer: await GlobalStore.getDomain() + "/",
        };
    }

    async getContent(contentId: string): Promise<Content> {
        return this.controller.getContent(contentId);
    }

    async getChapters(_: string): Promise<Chapter[]> {
        return []
    }

    async getChapterData(
        contentId: string,
        chapterId: string
    ): Promise<ChapterData> {
        return this.controller.getChapterData(contentId, chapterId);
    }

    async getTags(): Promise<Property[]> {
        const properties: Property[] = []
        const tags = await this.controller.getCategories();
        properties.push({id: "categories", title: "Thể loại", tags})
        return properties
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


    // Preferences
    async getPreferenceMenu(): Promise<Form> {
        return {
            sections: [
                {
                    header: "Excluded Content",
                    children: [
                        UIMultiPicker({
                            id: PREF_KEYS.exclude_categories,
                            title: `Excluded Categories`,
                            options: await this.controller.getCategories(),
                            value: await GlobalStore.getExcludeCategories(),
                            didChange: GlobalStore.setExcludeCategories,
                        }),
                    ],
                },
                {
                    header: "Image Server",
                    children: [
                        UIPicker({
                            id: PREF_KEYS.image_server,
                            title: `Select Image Server`,
                            options: IMAGE_SERVERS,
                            value: await GlobalStore.getImageServer(),
                            didChange: GlobalStore.setImageServer,
                        }),
                    ],
                },
                {
                    header: "HentaiVN Domain",
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
