import {
    CatalogRating,
    type Chapter,
    type ChapterData,
    type Content,
    type ContentSource,
    type DirectoryConfig,
    type DirectoryRequest,
    FilterType,
    Form,
    ImageRequestHandler,
    NetworkRequest,
    type PagedResult,
    PageLink,
    PageLinkResolver,
    PageSection,
    Property,
    ResolvedPageSection,
    RunnerInfo,
    RunnerPreferenceProvider,
    UIPicker
} from "@suwatte/daisuke"
import {IMAGE_QUALITIES, IMAGE_SERVERS, PREF_KEYS, READCOMICONLINE_URL, SEARCH_SORTERS} from "./constants"
import {Controller} from "./controller";
import {GlobalStore} from "./store";
import {startCase} from "lodash";

export class Target implements ContentSource, PageLinkResolver, ImageRequestHandler, RunnerPreferenceProvider {

    info: RunnerInfo = {
        id: "readcomiconline",
        name: "ReadComicOnline",
        thumbnail: "readcomiconline.png",
        website: READCOMICONLINE_URL,
        version: 0.1,
        supportedLanguages: ["EN_US"],
        rating: CatalogRating.SAFE,
    }

    private controller = new Controller();

    headers(): Record<string, string> {
        return {
            Referer: READCOMICONLINE_URL + "/",
        };
    }

    async getContent(contentId: string): Promise<Content> {
        return this.controller.getContent(contentId)
    }

    async getChapters(contentId: string): Promise<Chapter[]> {
        return this.controller.getChapters(contentId)
    }

    async getChapterData(
        _: string,
        chapterId: string,
    ): Promise<ChapterData> {
        return this.controller.getChapterData(chapterId)
    }

    async getTags(): Promise<Property[]> {
        const filters = await this.controller.getFilters();
        return filters
            .filter(v => v.type != FilterType.TEXT)
            .map(({id, title, options}) => ({
                id,
                title,
                tags: (options ?? []).map((v) => ({
                    id: `/${startCase(id)}/` + v.title.replace(/[^\w\s]/gi, '')
                        .replace(/\s+/g, '-'),
                    title: v.title,

                })),
            }))
    }

    async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
        return this.controller.getSearchResults(request);
    }

    async getDirectoryConfig(): Promise<DirectoryConfig> {
        return {
            filters: await this.controller.getFilters(),
            sort: {
                options: SEARCH_SORTERS,
                canChangeOrder: false,
                default: {
                    id: "",
                    ascending: false
                },
            },
        }
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

    async getPreferenceMenu(): Promise<Form> {
        return {
            sections: [
                {
                    header: "Image Options",

                    children: [
                        UIPicker({
                            id: PREF_KEYS.image_server,
                            title: `Image Server`,
                            options: IMAGE_SERVERS,
                            value: await GlobalStore.getImageServer(),
                            didChange: GlobalStore.setImageServer,
                        }),
                        UIPicker({
                            id: PREF_KEYS.image_quality,
                            title: `Quality`,
                            options: IMAGE_QUALITIES,
                            value: await GlobalStore.getImageQuality(),
                            didChange: GlobalStore.setImageQuality,
                        }),
                    ],
                },
            ],
        };
    }
}
