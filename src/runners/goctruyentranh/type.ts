export interface GetGalleryListRequest {
    p?: number;
    value: string;
}

export interface SearchGalleryRequest {
    p?: number;
    searchValue?: string;
    status?: string[];
    categories?: string[];
    orders?: string[];
}

export interface GetGalleriesApiResponse {
    status: boolean;
    code: number;
    result: GalleriesResult;
}

interface GalleriesResult {
    p: number;
    limit: number;
    next: boolean;
    data: Gallery[];
}

export interface Gallery {
    id: string;
    name: string;
    nameEn: string;
    statusCode: string;
    photo: string;
    description: string;
    author: string;
    chapterLatest: string[];
    chapterLatestId: string[];
    chapterLatestDate: string[];
    category: string[];
    categoryCode: string[];
    createDate: string;
    updateDate: string;
    followerCount: string;
    viewCount: string;
    evaluationScore: number;
}

export interface GetChaptersApiResponse {
    status: boolean;
    code: number;
    result: ChaptersResult;
}

export interface ChaptersResult {
    limit: number;
    chapters: ChapterInfo[];
}

export interface ChapterInfo {
    id: string;
    comicId: string;
    numberChapter: string;
    stringUpdateTime: string;
}

export interface ChapterImagesResponse {
    status: boolean;
    code: number;
    result: ChapterImages;
}

export interface ChapterImages {
    data: string[];
}
