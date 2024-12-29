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
    UIStepper,
} from "@suwatte/daisuke";
import {ALLPORNCOMIC_DOMAIN, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";

export class Target implements ContentSource,
    PageLinkResolver,
    ImageRequestHandler,
    RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "allporncomic",
        website: ALLPORNCOMIC_DOMAIN,
        version: 0.1,
        name: "AllPornComic",
        supportedLanguages: ["en-us"],
        thumbnail: "allporncomic.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.NSFW,
    };
    private controller = new Controller();

    headers(): Record<string, string> {
        return {
            Referer: ALLPORNCOMIC_DOMAIN + "/",
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
        const genres: DirectoryFilter | undefined = filters.pop()
        return [{
            id: "genres",
            title: "Genres",
            tags: genres?.options?.map(genre => ({id: genre.id, title: genre.title})) || []
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
                ...this.headers(),
            },
        }
    }

    async getPreferenceMenu(): Promise<Form> {
        return {
            sections: [
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

