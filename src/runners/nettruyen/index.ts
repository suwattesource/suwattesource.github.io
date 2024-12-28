import {
    BasicAuthenticatable,
    BasicAuthenticationUIIdentifier,
    CatalogRating,
    Chapter,
    ChapterData,
    ChapterEventHandler,
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
    User,
} from "@suwatte/daisuke";
import {ADULT_TAGS, IMAGE_SERVERS, NETTRUYEN_DOMAIN, PERSONAL_LISTS, PREF_KEYS, SEARCH_SORTERS} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";
import {isLoggedIn} from "./utils";
import {ReadingFlag} from "@suwatte/daisuke/dist/types";

export class Target implements ContentSource,
    PageLinkResolver,
    ChapterEventHandler,
    ContentEventHandler,
    ImageRequestHandler,
    BasicAuthenticatable,
    RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "nettruyen",
        website: NETTRUYEN_DOMAIN,
        version: 1.0,
        name: "NetTruyen (Unavailable)",
        supportedLanguages: ["vi-vn"],
        thumbnail: "nettruyen.png",
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
                canChangeOrder: false,
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
                    header: "NetTruyen Domain",
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

    async handleBasicAuth(_: string, password: string) {
        return this.controller.handleAuth(password)
    }

    async getAuthenticatedUser() {
        const token = await SecureStore.get("token");
        if (!token) {
            return null;
        }

        const username = await SecureStore.string("user_name") || "";
        const avatar = await SecureStore.string("avatar") || "";

        const user: User = {
            handle: username,
            avatar: avatar
        };

        return user;
    }

    async handleUserSignOut() {
        await SecureStore.remove("token");
    }

    async onChapterRead(contentId: string, chapterId: string): Promise<void> {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        await this.controller.syncToNetTruyen(contentId, chapterId);
    }

    async onChaptersMarked(contentId: string, chapterIds: string[], completed: boolean): Promise<void> {
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

