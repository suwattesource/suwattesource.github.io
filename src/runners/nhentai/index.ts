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
} from "@suwatte/daisuke";
import {LANGUAGES, NHENTAI_DOMAIN, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target
    implements ContentSource, RunnerPreferenceProvider, PageLinkResolver, ImageRequestHandler {
    info: RunnerInfo = {
        id: "nhentai",
        website: NHENTAI_DOMAIN,
        version: 1.0,
        name: "nHentai",
        supportedLanguages: LANGUAGES.map((v) => v.languageCode + "-" + v.regionCode),
        thumbnail: "nhentai.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.NSFW,
    };
    private controller = new Controller();

    headers(): Record<string, string> {
        return {
            Referer: NHENTAI_DOMAIN + "/",
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
        const properties: Property[] = []
        const tags = await this.controller.getPopularTags()
        properties.push({id: "tags", title: "Tags", tags})
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
                            options: await this.controller.getPopularTagsToExclude(),
                            value: await GlobalStore.getExcludeTags(),
                            didChange: GlobalStore.setExcludeTags,
                        }),
                        UIStepper({
                            id: PREF_KEYS.number_of_tag_pages_to_exclude,
                            title: `Number of popular tag pages (to exclude)`,
                            lowerBound: 1,
                            upperBound: 10,
                            step: 1,
                            value: await GlobalStore.getNumPagesToExclude(),
                            didChange: GlobalStore.setNumPagesToExclude,
                        }),
                    ],
                },
                {
                    header: "Tags Fetching",
                    children: [
                        UIStepper({
                            id: PREF_KEYS.number_of_tag_pages_to_exclude,
                            title: `Number of popular tag pages`,
                            lowerBound: 1,
                            upperBound: 5,
                            step: 1,
                            value: await GlobalStore.getNumPages(),
                            didChange: GlobalStore.setNumPages,
                        }),
                    ],
                },
                {
                    header: "Chapter Split",
                    children: [
                        UIStepper({
                            id: PREF_KEYS.number_of_images_per_chapter,
                            title: `Max images per chapter`,
                            lowerBound: 0,
                            upperBound: 1000,
                            step: 10,
                            value: await GlobalStore.getNumImages(),
                            didChange: GlobalStore.setNumImages,
                        }),
                    ],
                },
            ],
        };
    }
}
