export interface GetGalleryListRequest {
    num_chapter?: number;
    sort?: string;
    hot?: number | string;
    tag?: string;
    limit?: number;
    page?: number;
    user?: number;
    child_protect?: string;
}

export interface Statics {
    view: number;
    follow: string;
}

export interface Info {
    tags: string[];
    name: string;
    name_other: string[];
    url: string;
    url_other: string[];
    source: string;
    status: string;
    detail: string;
    auto_update: string;
    hidden: number;
    chapter: Chapter;
    statics: Statics;
    avatar: string;
    id: number;
    type: string;
}

export interface Gallery {
    id_album: string;
    info: Info;
    last_update: string;
    score: string;
}

export interface GalleryInfo {
    title: string;
    cover: string;
    status: string;
    views: string;
    follows: string;
    description: string;
    tags: string[];
    last_update: string;
}

export interface ChapterInfo {
    name: string;
    type: string;
    source: string;
    num: string;
    last_update: string;
    album: string;
    hidden: number;
    upload: number;
    upload_time: number;
    statics: {
        view: number;
    };
    id: string;
    upload_num: number;
}

export interface Chapter {
    id_chapter?: string;
    info?: ChapterInfo;
    last?: string;
    id?: string;
}

export interface ChapterImage {
    image: string[];
}



export interface Genre {
    name: string;
    url: string;
    detail: string;
    important: number;
    string: string;
}

export interface UserData {
    country: string;
    language: string;
    avatar: string;
    name: string
}
