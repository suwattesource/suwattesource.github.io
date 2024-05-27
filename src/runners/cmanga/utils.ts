import {Chapter, ChapterInfo, Gallery, Info} from "./type";

export function parseGalleries(galleries: Gallery[]): Gallery[] {
    return galleries.map((gallery: Gallery) => ({
        ...gallery,
        info: JSON.parse(String(gallery.info)) as Info
    }));
}

export function parseChapters(chapters: Chapter[]): ChapterInfo[] {
    return chapters.map((chapter: Chapter) => (JSON.parse(String(chapter.info)) as ChapterInfo));
}
