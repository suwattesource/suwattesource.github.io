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
import {PREF_KEYS, SAYHENTAI_DOMAIN, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target
    implements ContentSource, RunnerPreferenceProvider, PageLinkResolver, ImageRequestHandler {
    info: RunnerInfo = {
        id: "sayhentai",
        website: SAYHENTAI_DOMAIN,
        version: 0.1,
        name: "SayHentai",
        supportedLanguages: ["vi-vn"],
        thumbnail: "sayhentai.png",
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
                canChangeOrder: false,
                default: {
                    id: "",
                    ascending: false,
                },
            },
            lists: [
                {
                    id: "completed",
                    title: "Truyện Full"
                }
            ],
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
                    header: "SayHentai Domain",
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
