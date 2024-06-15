import {
    Chapter,
    ChapterData,
    Content,
    Highlight,
    Option,
    Property,
    PublicationStatus,
    ReadingMode,
    Tag
} from "@suwatte/daisuke";
import {CheerioAPI, Element} from "cheerio";

import {MANGA_TYPES} from "./constants";
import {numberWithDot} from "../../utils/utils";

export class Parser {

    getTopDayMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];
        $('#slide-top>div.col-4').each((_: any, manga: any) => {
            const id = $('a', manga).first().attr('href')
            const title = $('div.line-2', manga).text().trim()
            const cover = encodeURI($('a>img', manga).attr("src") || "")
            const lastChapter = $('a.btn-link', manga).text().trim();
            const postOn = $('span.post-on', manga).text().trim();
            if (id) {
                items.push({id, title, info: [`${lastChapter} • ${postOn}`], cover: cover});
            }
        });

        return items;
    }

    getDefaultMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];
        $('div.row >div.col-4').each((_: any, manga: any) => {
            const id = $('a', manga).first().attr('href')
            const title = $('div.line-2', manga).text().trim()
            const cover = encodeURI($('a>img', manga).attr("src") || "")
            const lastChapter = $('a.btn-link', manga).text().trim();
            const postOn = $('span.post-on', manga).text().trim();
            if (id) {
                items.push({id, title, info: [`${lastChapter} • ${postOn}`], cover: cover});
            }
        });

        return items;
    }

    getNewUploadMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.widget-content>.popular-item-wrap').each((_: any, manga: any) => {
            const id = $('a', manga).first().attr('href')
            const title = $('a', manga).attr('title')?.trim() || ""
            const cover = encodeURI($('a>img', manga).attr("data-src") || "")
            const lastChapter = $('span.chapter', manga).text().trim();
            const postOn = $('span.post-on', manga).text().trim();
            if (id) {
                items.push({id, title, info: [`${lastChapter} • ${postOn}`], cover: cover});
            }
        });

        return items;
    }

    async getHomepageSection($: CheerioAPI, id: string): Promise<Highlight[]> {
        switch (id) {
            case "sayhentai":
                return this.getDefaultMangas($)
            case "top-day":
                return this.getTopDayMangas($)
            case "new-manga":
                return this.getNewUploadMangas($)
            case "new-update":
                return this.getSearchResults($)
            default:
                return []
        }
    }

    getSearchResults($: CheerioAPI, includeSubtitle?: boolean): Highlight[] {
        const items: Highlight[] = [];

        $('.page-item-detail').each((_: any, manga: any) => {
            const id = $('a', manga).attr('href') || '';
            const title: string = $('h3.line-2>a', manga).text().trim() || '';
            const cover: string = encodeURI($('img', manga).attr('data-src') || $('img', manga).attr('src') || '');
            const lastChapter = $('span.chapter', manga).text().trim();
            const postOn = $('span.post-on', manga).text().trim();
            const subtitle = `${lastChapter} • ${postOn}`
            const info = [subtitle]
            const item: Highlight = {id, title, cover, info}
            if (includeSubtitle) {
                item.subtitle = subtitle
            }
            if (id) {
                items.push(item)
            }
        });
        return items;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $("div.post-title").text().trim()
        const cover = $(".summary_image>a>img").attr('src') || "";
        const summary = $(".description-summary").text().trim();

        const genres = $('.genres-content>a').toArray()
        const translators = $('.post-content_item>a').toArray();


        const additionalTitles: string[] = []
        const additionalTitle = $('.post-content_item:nth-child(4)>.summary-content').text().trim();
        if (additionalTitle || additionalTitle != "Updating") {
            additionalTitles.push(additionalTitle)
        }


        const genreTags = this.createTags($, genres)
        let recommendedPanelMode = ReadingMode.WEBTOON;
        genreTags.forEach((genre) => {
            if (MANGA_TYPES.includes(genre.title)) {
                recommendedPanelMode = ReadingMode.PAGED_MANGA;
            }
        })
        const isNSFW = true;

        const statusText = $('.post-content_item:nth-child(7)>.summary-content').text().trim(); // Get the text next to 'Tình Trạng:'
        let status = PublicationStatus.ONGOING; // Set default status
        if (statusText.includes("Đang Ra")) {
            status = PublicationStatus.ONGOING;
        } else if (statusText.includes("Truyện Full")) {
            status = PublicationStatus.COMPLETED;
        }

        const properties: Property[] = [];
        if (genres.length > 0) {
            properties.push({
                id: "genres",
                title: "Thể Loại",
                tags: genreTags,
            });
        }
        if (translators.length > 0) {
            properties.push({
                id: "translators",
                title: "Nhóm Dịch",
                tags: this.createTags($, translators),
            });
        }

        const info: string[] = []
        const views = $('.post-content_item:nth-child(6)>.summary-content').text().trim();
        if (views) {
            info.push(`👁 Lượt xem: ${numberWithDot(views)}`)
        }
        const commentAndFollower = $('.action_detail>span')
        const comments = commentAndFollower.first().text().split(' ').at(0)
        if (comments) {
            info.push(`💬 Bình luận: ${numberWithDot(comments)}`)
        }
        const followers = commentAndFollower.last().text().split(' ').at(0)
        if (followers) {
            info.push(`❤️ Theo dõi: ${numberWithDot(followers)}`)
        }

        const chapters = await this.getChapters($)
        return {
            title,
            additionalTitles,
            cover,
            summary,
            webUrl,
            chapters,
            isNSFW,
            properties,
            recommendedPanelMode,
            status,
            info,
        };
    }

    async getChapters($: CheerioAPI): Promise<Chapter[]> {
        const chapters: Chapter[] = [];
        let reassign = false
        $('.list-item.box-list-chapter>li').each((index: number, element: Element) => {
            const chapterId = $('a', element).attr('href') || "";
            const title = $('a', element).text().trim();
            const time = $('.chapter-release-date', element).text().trim();
            let number = Number(title.split(" ").pop())
            if (!number) {
                number = 0
                reassign = true
            }
            const date = this.convertTime(time)
            chapters.push({
                chapterId,
                title,
                date,
                number,
                index,
                language: "vi-vn",
            });
        });

        if (reassign) {
            let total = chapters.length
            chapters.map((chapter) => {
                chapter.number = total;
                total -= 1;
            })
        }

        return chapters;
    }

    getCategories($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $(".list-unstyled>li").each((_: any, tag: any) => {
            const id = $(tag).find('a')?.attr('href') || ""
            const title = $(tag).find('a').contents().not('span').text().trim()
            tags.push({id, title})
        })
        return tags
    }

    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];
        $('#chapter_content img').each((_: any, obj: any) => {
            const url = obj.attribs['src']
            urls.push(url);
        });

        return {
            pages: urls.map((url) => ({url})),
        };
    }

    createTags($: CheerioAPI, elements: Element[]): Tag[] {
        const tags: Tag[] = []
        for (const element of elements) {
            tags.push(
                {
                    title: $(element).text().trim(),
                    id: $(element).attr('href') || "",
                });
        }
        return tags
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
