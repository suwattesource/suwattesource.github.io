import {Chapter, ChapterData, Content, Highlight, Property, ReadingMode, Tag,} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";
import {ADULT_TAGS, VERTICAL_TYPES} from "./constants";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.row > div.item-manga').each((index: number, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('a').first().attr('title')?.trim() || ""
            const cover = $(element).find('a>img').attr('data-original') || ""
            items.push({id, title, cover})
        });
        return items;
    }

    getTrendingMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.owl-carousel.owl-theme > div.slide-item').each((_: any, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('h3>a').text()
            const cover = 'https:' + $(element).find('a>img').attr('data-src') || ""
            items.push({id, title, cover})
        });
        return items;
    }


    getTopMonthMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];

        $('#top-month ul li').each((_: any, manga: any) => {
            const title = $('h3', manga).text().trim();
            const id = $('a', manga).first().attr('href') || "";
            const cover = "https:" + $('img', manga).attr('data-original') || ""

            const viewsInMonth = $('.total-view', manga).text().trim()
            const latestChapter = $('.chap-latest >a', manga).text().trim()
            const info = [
                `Lượt xem tháng: ${viewsInMonth}`,
                latestChapter
            ]
            items.push({id, title, info, cover});
        });

        return items;
    }

    getHomepageSection($: CheerioAPI, id: string): Highlight[] {
        const highlights: Highlight[] = []
        switch (id) {
            case "trending":
                return this.getTrendingMangas($)
            case "latest":
                return this.getSearchResults($)
            case "top_month":
                return this.getTopMonthMangas($)
        }
        return highlights;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $('.title-manga').text().trim();
        const cover = $('.image-info>img').attr('src') || "";
        const summary = $(".detail-summary").text().trim();
        const genres: Tag[] = [];
        $('.category.row>.col-sm-8.col-7.detail-info>a').each((_: any, obj: any) => {
            const title = $(obj).text().trim();
            const id = $(obj).attr('href') || "";
            if (id) {
                genres.push({id: id, title: title, nsfw: ADULT_TAGS.includes(title)});
            }
        });

        // Reading Mode
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        genres.forEach((item) => {
            if (VERTICAL_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })

        const properties: Property[] = [];
        if (genres.length > 0) {
            properties.push({
                id: "genres",
                title: "Genres",
                tags: genres,
            });
        }

        const chapters = this.getChapters($)

        return {
            title,
            cover,
            summary,
            webUrl,
            recommendedPanelMode,
            chapters,
            properties
        };
    }

    getChapters($: CheerioAPI): Chapter[] {
        const chapters: Chapter[] = [];
        let index = 1
        let reassign = false
        $('div.list-chapter > nav > ul > li.row').each((_: any, obj: any) => {
            const chapterId = $(obj).find('a').attr('href') || ""

            const time = $('.col-4', obj).text().trim();
            const title = $('.col-5', obj).text().trim();
            let number = Number(title.match(/\d+(\.\d+)?/g))
            const date = this.convertTime(time);
            if (!number) {
                number = 0
                reassign = true
            }
            chapters.push({
                chapterId,
                number,
                title,
                index,
                language: "vi-vn",
                date: date,
            });
            index++;
        })
        if (reassign) {
            let total = chapters.length
            chapters.map((chapter) => {
                chapter.number = total;
                total -= 1;
            })
        }
        return chapters.slice(1);
    }

    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];
        $('.list-image-detail > .page-chapter').each((_: any, element: any) => {
            const url = "https:" + $(element).find('img').attr('src') || ""
            urls.push(url)
        });

        return {
            pages: urls.map((url) => ({url})),
        };
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