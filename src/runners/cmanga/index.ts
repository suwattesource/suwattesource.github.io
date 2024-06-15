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
    UITextField,
} from "@suwatte/daisuke";
import {CMANGA_DOMAIN, PREF_KEYS, SEARCH_SORTERS, USER_LIST} from "./constants";
import {Controller} from "./controller";
import {GlobalStore} from "./store";
import {isLoggedIn} from "./utils";
import {ReadingFlag} from "@suwatte/daisuke/dist/types";


export class Target
    implements ContentSource,
        PageLinkResolver,
        ChapterEventHandler,
        ContentEventHandler,
        ImageRequestHandler,
        BasicAuthenticatable,
        RunnerPreferenceProvider {
    info: RunnerInfo = {
        id: "cmanga",
        website: CMANGA_DOMAIN,
        version: 0.2,
        name: "CManga",
        supportedLanguages: ["vi-vn"],
        thumbnail: "cmanga.png",
        minSupportedAppVersion: "6.0",
        rating: CatalogRating.MIXED,
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
            lists: USER_LIST,
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

    async handleBasicAuth(username: string, password: string): Promise<void> {
        await this.controller.handleAuth(username, password)
    }

    async handleUserSignOut() {
        return this.controller.handleSignOut()
    }

    async getAuthenticatedUser() {
        return this.controller.getAuthUser()
    }

    async onChapterRead(_: string, chapterId: string): Promise<void> {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        return this.controller.markChapterAsRead(chapterId);
    }

    async onContentsAddedToLibrary(ids: string[]): Promise<void> {
        const loggedIn = await isLoggedIn();
        if (!loggedIn) return;
        for (const id of ids) {
            await this.controller.followManga(id);
        }
        return
    }


    async onChaptersMarked(_contentId: string, _chapterIds: string[], _completed: boolean): Promise<void> {
        return
    }

    async onContentsRemovedFromLibrary(_ids: string[]): Promise<void> {
        return
    }

    async onContentsReadingFlagChanged(_ids: string[], _flag: ReadingFlag): Promise<void> {
        return
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
