import {
    BasicAuthenticatable,
    BasicAuthenticationUIIdentifier,
    CatalogRating,
    Chapter,
    ChapterData,
    Content,
    ContentEventHandler,
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
    UIPicker,
    UITextField,
} from "@suwatte/daisuke";
import {ADULT_TAGS, IMAGE_SERVERS, PERSONAL_LISTS, PREF_KEYS, SEARCH_SORTERS, TRUYENQQ_DOMAIN} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";
import {isLoggedIn} from "./utils";
import {ReadingFlag} from "@suwatte/daisuke/dist/types";

export class Target implements ContentSource,
    PageLinkResolver,
    ContentEventHandler,
    ImageRequestHandler,
    BasicAuthenticatable,
    RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "truyenqq",
        website: TRUYENQQ_DOMAIN,
        version: 1.0,
        name: "TruyenQQ",
        supportedLanguages: ["vi-vn"],
        thumbnail: "truyenqq.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.SAFE,
    };
    BasicAuthUIIdentifier = BasicAuthenticationUIIdentifier.USERNAME
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
        return filters
            .map(({id, title, options}) => ({
                id,
                title,
                tags: (options ?? []).map((v) => ({
                    id: v.id,
                    title: v.title,
                    nsfw: ADULT_TAGS.includes(v.title),
                })),
            }))
            .filter((v) => v.tags.length != 0);
    }

    // Directory
    async getDirectory(request: DirectoryRequest): Promise<PagedResult> {
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
            lists: PERSONAL_LISTS,
        }
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
                    header: "TruyenQQ Domain",
                    children: [
                        UITextField({
                            id: PREF_KEYS.domain,
                            title: "Domain name",
                            value: await GlobalStore.getDomain(),
                            didChange: GlobalStore.setDomain.bind(GlobalStore)
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
            ],
        };
    }

    async handleBasicAuth(username: string, password: string) {
        return this.controller.handleAuth(username, password)
    }

    async getAuthenticatedUser() {
        return this.controller.getAuthUser()
    }

    async handleUserSignOut() {
        await SecureStore.remove("session");
    }

    async onContentsAddedToLibrary(ids: string[]): Promise<void> {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        for (const id of ids) {
            await this.controller.followManga(id)
        }
    }

    async onContentsRemovedFromLibrary(ids: string[]): Promise<void> {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        for (const id of ids) {
            await this.controller.followManga(id)
        }
    }

    async onContentsReadingFlagChanged(ids: string[], flag: ReadingFlag): Promise<void> {

    }
}

