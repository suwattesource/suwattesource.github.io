import {
    Chapter,
    ChapterData,
    Content,
    DirectoryFilter,
    FilterType,
    Highlight,
    Property,
    ReadingMode,
    Tag,
} from "@suwatte/daisuke";
import {DEFAULT_FILTERS, STATUS_KEYS, VERTICAL_TYPES} from "./constants";
import {Category, ChapterInfo, Gallery} from "./type";
import {GlobalStore} from "./store";

export class Parser {
    async getSearchResults(galleries: Gallery[], includeSubtitle?: boolean): Promise<Highlight[]> {
        const domain = await GlobalStore.getDomain()
        const items: Highlight[] = [];
        for (const gallery of galleries) {
            const id = gallery.id
            const title = gallery.name
            const cover = domain + gallery.photo
            const info = [`Chương ${gallery.chapterLatest[0]} • ${gallery.chapterLatestDate[0]}`]
            const categories = gallery.category?.join(", ").match(/.{1,32}(,\s|$)|.{1,32}$/g) || []
            info.push(...categories)
            const item: Highlight = {id, title, cover, info}
            const lastChapter = `Chương ${gallery.chapterLatest[0]}`
            const totalViews = `👁️ ${gallery.viewCount}`
            const subtitle = [totalViews, lastChapter].join(' • ')
            if (includeSubtitle) {
                item.subtitle = subtitle;
            }
            items.push(item)
        }
        return items
    }

    async getContent(domain: string, gallery: Gallery | null, chapterInfos: ChapterInfo[], webUrl: string): Promise<Content> {
        if (!gallery) {
            return {
                title: "",
                cover: ""
            }
        }
        const title = gallery.name
        const additionalTitles = gallery.otherName.split(',').map(v => v.trim())
        const cover = domain + gallery.photo
        const summary = gallery.description
        const categories: Tag[] = [];
        for (let i = 0; i < gallery.category.length; i++) {
            categories.push({
                id: gallery.categoryCode[i] || "",
                title: gallery.category[i] || "",
            });
        }
        // Reading Mode
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        categories.forEach((item) => {
            if (VERTICAL_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })

        const status = STATUS_KEYS[gallery.statusCode]

        const properties: Property[] = [];
        properties.push({
            id: "categories",
            title: "Categories",
            tags: categories,
        });

        const chapters = this.getChapters(chapterInfos)

        const info = [
            `👁️ Lượt xem: ${gallery.viewCount}`,
            `❤️ Lượt theo dõi: ${gallery.followerCount}`,
            `⭐️ Đánh giá: ${gallery.evaluationScore.toFixed(1)}/5`,

        ].filter((v) => !!v);

        return {
            title,
            additionalTitles,
            cover,
            summary,
            recommendedPanelMode,
            chapters,
            properties,
            info,
            status,
            webUrl,
        };
    }

    getChapters(chapterInfos: ChapterInfo[]): Chapter[] {
        const chapters: Chapter[] = [];
        let index = 1
        for (const chapterInfo of chapterInfos) {
            const chapterId = chapterInfo.numberChapter
            const number = Number(chapterInfo.numberChapter)
            const title = `Chương ${number}`
            const date = this.convertTime(chapterInfo.stringUpdateTime)
            chapters.push({
                chapterId,
                number,
                title,
                index,
                language: "vi-vn",
                date: date,
            });
            index++
        }
        return chapters
    }

    getChapterData(urls: string[]): ChapterData {
        return {
            pages: urls.map((url) => ({url})),
        };
    }

    getFilters(categories: Category[]): DirectoryFilter[] {
        const filters = DEFAULT_FILTERS;
        // categories
        filters.push({
            id: "categories",
            title: "Thể loại",
            type: FilterType.MULTISELECT,
            options: categories.map((v) => ({
                id: v.id,
                title: v.name,
            })),
        });

        return filters;
    }

    convertTime = (timeAgo: string): Date => {
        let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
        trimmed = (trimmed === 0 && timeAgo.includes('a')) ? 1 : trimmed;

        if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
            return new Date(Date.now() - trimmed * 1000);
        } else if (timeAgo.includes('phút')) {
            return new Date(Date.now() - trimmed * 60000);
        } else if (timeAgo.includes('giờ')) {
            return new Date(Date.now() - trimmed * 3600000);
        } else if (timeAgo.includes('ngày')) {
            return new Date(Date.now() - trimmed * 86400000);
        } else if (timeAgo.includes('tháng')) {
            return new Date(Date.now() - trimmed * 2592000000);
        } else if (timeAgo.includes('năm')) {
            return new Date(Date.now() - trimmed * 31556952000);
        } else {
            const [day, month, year] = timeAgo.split("-").map(Number);
            if (!year || !month || !day) {
                return new Date()
            }
            return new Date(year, month - 1, day)
        }
    }
}