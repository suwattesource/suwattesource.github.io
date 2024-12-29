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
import {EXCLUDED_TAG, IMHENTAI_DOMAIN, LANGUAGES, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target
    implements ContentSource, RunnerPreferenceProvider, ImageRequestHandler, PageLinkResolver {
    info: RunnerInfo = {
        id: "imhentai",
        website: IMHENTAI_DOMAIN,
        version: 1.2,
        name: "IMHentai",
        supportedLanguages: LANGUAGES.map((v) => v.languageCode + "-" + v.regionCode),
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
        const tags = await this.controller.getPopularTags()
        properties.push({id: "tags", title: "Tags", tags})
        return properties
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
                            id: "exclude_tags",
                            title: `Excluded Tags`,
                            options: EXCLUDED_TAG,
                            value: await GlobalStore.getExcludeTags(),
                            didChange: GlobalStore.setExcludeTags,
                        }),
                    ],
                },
                {
                    header: "Tags Fetching",
                    children: [
                        UIStepper({
                            id: PREF_KEYS.number_of_tag_pages,
                            title: `Number of popular tag pages`,
                            lowerBound: 1,
                            upperBound: 10,
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
