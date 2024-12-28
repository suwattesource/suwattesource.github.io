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
    UIStepper,
    UIToggle,
} from "@suwatte/daisuke";
import {EHENTAI_DOMAIN, LANGUAGES, PREF_KEYS, SEARCH_SORTERS, TOPLIST_PAGES} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target
    implements ContentSource, RunnerPreferenceProvider, ImageRequestHandler, PageLinkResolver {
    info: RunnerInfo = {
        id: "ehentai",
        website: EHENTAI_DOMAIN,
        version: 1.0,
        name: "E-Hentai",
        supportedLanguages: LANGUAGES.map((v) => v.languageCode + "-" + v.regionCode),
        thumbnail: "ehentai.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.NSFW,
    };
    private controller = new Controller();

    headers(): Record<string, string> {
        return {
            Referer: EHENTAI_DOMAIN + "/",
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
        contentId: string,
        chapterId: string
    ): Promise<ChapterData> {
        return this.controller.getChapterData(contentId, chapterId);
    }

    async getTags(): Promise<Property[]> {
        const properties: Property[] = []
        const tagFilters = await this.controller.getFilterTags()
        for (const tagFilter of tagFilters) {
            properties.push({id: tagFilter.id, title: tagFilter.title, tags: tagFilter.options ?? []})
        }
        return properties
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
            lists: TOPLIST_PAGES,
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
                ...this.headers(),
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
                            id: PREF_KEYS.exclude_tags,
                            title: `Excluded Tags`,
                            options: await this.controller.getTags(),
                            value: await GlobalStore.getExcludeTags(),
                            didChange: GlobalStore.setExcludeTags,
                        }),
                    ],
                },
                {
                    header: "Related Galleries",
                    children: [
                        UIToggle({
                            id: PREF_KEYS.related_galleries,
                            title: "Enable Related Galleries",
                            value: await GlobalStore.getRelatedGalleriesToggle(),
                            didChange: GlobalStore.setRelatedGalleriesToggle,
                        }),
                        UIStepper({
                            id: PREF_KEYS.number_of_galleries,
                            title: `Maximum number of galleries`,
                            lowerBound: 1,
                            upperBound: 10,
                            step: 1,
                            value: await GlobalStore.getNumGalleries(),
                            didChange: GlobalStore.setNumGalleries,
                        }),
                    ],
                },

            ],
        };
    }
}
