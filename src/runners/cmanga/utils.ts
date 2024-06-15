import {Chapter, ChapterInfo, Gallery, Info} from "./type";
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

export const getCookieValue = (cookieArray: string[], cookieName: string): string | null => {
    const cookieString = cookieArray.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
    if (!cookieString) {
        return null;
    }
    const firstPart = cookieString.split(';')[0];
    const keyValue = firstPart?.split('=');
    if (!keyValue) {
        return null
    }
    return keyValue.length > 1 ? keyValue.slice(1).join('=') : null;
};


export async function isLoggedIn(): Promise<boolean> {
    const userId = await SecureStore.string(UserId);
    return userId != null
}
