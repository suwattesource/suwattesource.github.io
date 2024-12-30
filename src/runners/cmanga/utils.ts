import {Chapter, ChapterImage, ChapterInfo, Gallery, Info} from "./type";
import {NetworkRequest} from "@suwatte/daisuke";
import {GlobalStore} from "./store";
import {CookieNamePassword, CookieNameSession, UserId} from "./constants";

export function parseGalleries(galleries: Gallery[]): Gallery[] {
    return galleries.map((gallery: Gallery) => ({
        ...gallery,
        info: JSON.parse(String(gallery.info)) as Info
    }));
}

export function parseChapters(chapters: Chapter[]): ChapterInfo[] {
    return chapters.map((chapter: Chapter) => (JSON.parse(String(chapter.info)) as ChapterInfo));
}

export function parseChapterImages(chapterImage: ChapterImage): string[] {
    return chapterImage.image
}

export async function AuthInterceptor(request: NetworkRequest) {
    const sessionCookie = await SecureStore.string(CookieNameSession);
    const passwordCookie = await SecureStore.string(CookieNamePassword)
    if (!sessionCookie || !passwordCookie) return request;
    request.headers = {
        ...request.headers,
        referer: await GlobalStore.getDomain(),
    };
    request.cookies = [
        {
            name: CookieNameSession,
            value: sessionCookie
        },
        {
            name: CookieNamePassword,
            value: passwordCookie
        },
    ]

    return request;
}

export const getCookieValue = (setCookies: string, cookieName: string): string => {
    // Split the Set-Cookie header into individual cookies
    const cookies = setCookies.split(/;\s*/);

    // Find the cookie with the specified name and extract its value
    for (const cookie of cookies) {
        if (cookie.startsWith(`${cookieName}=`)) {
            return cookie.substring(cookieName.length + 1);
        }
    }
    return "";
}

export async function isLoggedIn(): Promise<boolean> {
    const userId = await SecureStore.string(UserId);
    return userId != null
}
