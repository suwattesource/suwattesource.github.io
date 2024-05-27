import {
    Category,
    CategoryResponse,
    ChapterImagesResponse,
    ChapterInfo,
    Gallery,
    GetChaptersApiResponse,
    GetGalleriesApiResponse,
    SearchGalleryRequest
} from "./type";

export function parseGalleries(resp: GetGalleriesApiResponse): Gallery[] {
    return resp.result.data
}

export function parseChapters(resp: GetChaptersApiResponse): ChapterInfo[] {
    return resp.result.chapters
}

export function parseChapterImages(resp: ChapterImagesResponse): string[] {
    return resp.result.data
}

export function parseCategories(resp: CategoryResponse): Category[] {
    return resp.result
}

export function buildQueryString(request: SearchGalleryRequest): string {
    return Object.entries(request)
        .flatMap(([key, value]) => {
            if (Array.isArray(value)) {
                return value.map(item => `${encodeURIComponent(key)}%5B%5D=${encodeURIComponent(item)}`);
            }
            if (value !== undefined) {
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            }
            return [];
        })
        .join('&');
}
