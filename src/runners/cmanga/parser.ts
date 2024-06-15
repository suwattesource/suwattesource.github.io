import {Chapter, ChapterData, Content, Highlight, Property, PublicationStatus, ReadingMode,} from "@suwatte/daisuke";
import {STATUS_KEYS, VERTICAL_TYPES} from "./constants";
import {GlobalStore} from "./store";
import {ChapterInfo, Gallery, GalleryInfo} from "./type";
import {numberWithDot, startCase} from "../../utils/utils";

export class Parser {

    async getSearchResults(galleries: Gallery[], includeSubtitle?: boolean): Promise<Highlight[]> {
        const domain = await GlobalStore.getDomain()
        const items: Highlight[] = [];
        for (const gallery of galleries) {
            const id = `${gallery.info.url}-${gallery.info.id}`
            const title = startCase(gallery.info.name)
            const cover = `${domain}/assets/tmp/album/${gallery.info.avatar}`
            const info = [`Chương ${gallery.info.chapter.last} • ${gallery.last_update}`]
            const genres = gallery.info.tags.map(tag => startCase(tag)).join(", ").match(/.{1,32}(,\s|$)|.{1,32}$/g) || []
            info.push(...genres)
            const item: Highlight = {id, title, cover, info}
            const lastChapter = `Chương ${gallery.info.chapter.last}`
            const totalViews = `👁️ ${numberWithDot(gallery.info.statics.view)}`
            const subtitle = [totalViews, lastChapter].join(' • ')
            if (includeSubtitle) {
                item.subtitle = subtitle;
            }
            items.push(item)
        }
        return items
    }

    async getContent(gallery: GalleryInfo, chapterInfos: ChapterInfo[], webUrl: string): Promise<Content> {
        const title = gallery.title
        const summary = gallery.description
        const cover = gallery.cover
        const status = STATUS_KEYS[gallery.status] || PublicationStatus.ONGOING
        const chapters = this.getChapters(chapterInfos)
        const properties: Property[] = [];
        // Reading Mode
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        gallery.tags.forEach((tag) => {
            if (VERTICAL_TYPES.includes(tag)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })

        properties.push({
            id: "genres",
            title: "Genres",
            tags: gallery.tags.map(tag => ({id: tag.toLowerCase(), title: tag})),
        });
        const info = [
            `👁️ Lượt xem: ${numberWithDot(gallery.views)}`,
            `📚  Lượt theo dõi: ${numberWithDot(gallery.follows)}`,
        ]
        return {
            title,
            summary,
            cover,
            status,
            chapters,
            properties,
            info,
            webUrl,
            recommendedPanelMode
        };

    }

    getChapters(chapterInfos: ChapterInfo[]): Chapter[] {
        const chapters: Chapter[] = [];
        let idx = 0
        for (const chapterInfo of chapterInfos) {
            chapters.push({
                chapterId: String(chapterInfo.id),
                number: Number(chapterInfo.num),
                title: startCase(chapterInfo.name),
                index: idx,
                language: "vi-vn",
                date: this.convertDate(chapterInfo.last_update),
            });
            idx += 1;
        }
        return chapters;
    }

    getChapterData(chapterImages: string[]): ChapterData {
        return {
            pages: chapterImages.map(url => ({url}))
        };
    }

    convertDate(dateString: string): Date {
        const date = dateString.split(" ")[0] || ""
        const [year, month, day] = date.split("-").map(Number);
        if (!year || !month || !day) {
            return new Date()
        }
        return new Date(year, month - 1, day)
    }

}
