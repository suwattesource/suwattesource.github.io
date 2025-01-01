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
    console.log(sessionCookie, passwordCookie)
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
    if (!setCookies) return "";
    const cookies = setCookies.split(/, ?/);

    for (const cookie of cookies) {
        let cleanedCookie = cookie;
        if(cleanedCookie.startsWith('"')) {
            cleanedCookie = cleanedCookie.substring(1);
        }
        const parts = cleanedCookie.split(";");
        const [namePart, ...valueParts] = parts[0]?.split("=") || [];

        if (namePart === cookieName) {
            return valueParts.join("=");
        }
    }
    return "";
};

export async function isLoggedIn(): Promise<boolean> {
    const userId = await SecureStore.string(UserId);
    return userId != null
}
