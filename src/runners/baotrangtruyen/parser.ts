import {Chapter, ChapterData, Content, Highlight, Property, ReadingMode, Tag,} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";
import {ADULT_TAGS, VERTICAL_TYPES} from "./constants";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.row > div.item').each((index: number, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('a').first().attr('title')?.trim() || ""
            const cover = $(element).find('a>img').attr('src') || ""
            items.push({id, title, cover})
        });
        return items;
    }

    getNewMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.items-slide.items-slide1>.owl-carousel.clearfix.owl-theme>div.item').each((_: any, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('a').first().attr('title')?.trim() || ""
            const cover = $(element).find('a>img').attr('src') || ""
            items.push({id, title, cover})
        });
        return items;
    }


    getTopMonthMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];

        $('#topMonth ul li').each((_: any, manga: any) => {
            const title = $('h3', manga).text().trim();
            const id = $('a', manga).first().attr('href') || "";
            const cover = $('img', manga).attr('src') || ""

            const viewsInMonth = $('p.chapter.top span', manga).text().trim()
            const latestChapter = $('p.chapter.top > a', manga).text().trim()
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
            case "update-manga":
                return this.getSearchResults($)
            case "new-manga":
                return this.getNewMangas($)
            case "top-month":
                return this.getTopMonthMangas($)
        }
        return highlights;
    }

    async getContent($: CheerioAPI, chaptersCheerio: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $('h1[itemprop="name"]').text().trim();
        const cover = $('img[itemprop="image"]').attr('data-src') || "";
        const summary = $(".detail-content > p").text().trim();
        const genres: Tag[] = [];
        $('.col-xs-12>a').each((_: any, obj: any) => {
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

        const chapters = this.getChapters(chaptersCheerio)

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
        let index = 0
        let reassign = false
        $('nav>ul>li.row ').each((_: any, element: any) => {
            const chapterId = $(element).find('a').attr('href') || ""
            let title = $(element).find('a').text().trim()
            let number = Number(title.match(/(?:Chapter|Chương) (\d+(\.\d+)?)/i)?.[1])
            if (!number) {
                number = 0
                reassign = true
            }
            const isLock = $(element).find('p.coin-unlock').attr('title') != null
            if (isLock) {
                title += " (Đang khoá)"
            }
            const date = $(element).find('.col-xs-4.text-center.small').text().trim()
            if (chapterId) {
                chapters.push({
                    chapterId,
                    title,
                    number,
                    index,
                    language: "vi-vn",
                    date: this.convertTime(date),
                });
                index++;
            }
        })
        if (reassign) {
            let total = chapters.length
            chapters.map((chapter) => {
                chapter.number = total;
                total -= 1;
            })
        }
        return chapters;
    }

    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];
        $('.reading-detail.box_doc > .page-chapter').each((_: any, element: any) => {
            const url = $(element).find('img').attr('src') || ""
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
        } else if (timeAgo.includes(':')) {
            const [H, D] = timeAgo.split(' ');
            const fixD = String(D).split('/');
            const finalD = `${fixD[1]}/${fixD[0]}/${new Date().getFullYear()}`;
            return new Date(`${finalD} ${H}`);
        } else {
            const split = timeAgo.split('/');
            return new Date(`${split[1]}/${split[0]}/20${split[2]}`);
        }
    }
}