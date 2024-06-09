import {Chapter, ChapterData, Content, Highlight, HighlightCollection, Option, ReadingMode,} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";
import {STATUS_KEYS} from "./constants";
import {numberWithDot} from "../../utils/utils";
import {GlobalStore} from "./store";

export class Parser {

    getTrendingMangas($: CheerioAPI, domain: string): Highlight[] {
        const items: Highlight[] = [];
        $('.bixbox:nth-child(2) > .listupd > div').each((_, element) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('div.caption').text().trim();
            const cover = domain + $(element).find('img').attr('data-src') || "";
            if (id) items.push({id, title, cover});
        })
        return items;
    }

    getPopularMangas($: CheerioAPI, domain: string): Highlight[] {
        const items: Highlight[] = [];
        $('.bixbox:nth-child(3) > .listupd > div').each((_, element) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('div.caption').text().trim();
            const cover = domain + $(element).find('img').attr('data-src') || "";
            if (id) items.push({id, title, cover});
        })
        return items;
    }

    getNewUpdateMangas($: CheerioAPI, domain: string): Highlight[] {
        const items: Highlight[] = [];
        $('div.content-manga-left > div > div.listupd > .page-item > div > .thumb-manga').each((_, element) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('a').attr('title')?.trim() || "";
            const cover = domain + $(element).find('img').attr('data-src') || "";
            if (id) items.push({id, title, cover});
        })
        return items;
    }

    getHomepageSection($: CheerioAPI, domain: string, id: string): Highlight[] {
        const highlights: Highlight[] = []
        switch (id) {
            case "trending":
                return this.getTrendingMangas($, domain)
            case "popular":
                return this.getPopularMangas($, domain)
            case "new-update":
                return this.getNewUpdateMangas($, domain)
        }
        return highlights;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const domain = await GlobalStore.getDomain()
        const title = $(".post-title").text().trim();
        const cover = domain + $(".img-loading").attr('data-src') || "";
        const summary = $(".dsct").text().trim();
        const recommendedPanelMode = ReadingMode.WEBTOON;

        // Related Content
        const collections: HighlightCollection[] = [];
        const relatedMangas = this.getRelatedMangas($);

        if (relatedMangas.length > 0) {
            collections.push({
                id: "related_manga",
                title: "Cùng người đăng",
                highlights: relatedMangas,
            });
        }

        const followers = $('.sumbmrk').text().trim().split(' ')[0] || "";
        const info = [
            `❤️ Theo dõi: ${numberWithDot(followers)}`,
        ]

        const status = STATUS_KEYS[$('p:contains("Trạng thái:") > span').text().trim()];

        const chapters = this.getChapters($)

        return {
            title,
            cover,
            summary,
            webUrl,
            recommendedPanelMode,
            collections,
            chapters,
            info,
            status,
        };
    }

    getRelatedMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.lst>ul.list-unstyled>li').each((_: any, manga: any) => {
            const title = $(manga).find('p.al-c').text()
            const id = $(manga).find('a').attr('href') || ""
            const cover = $(manga).find('a>img').attr('src') || ""
            if (id) {
                items.push({id, title, cover})
            }
        })
        return items
    }

    getChapters($: CheerioAPI): Chapter[] {
        const chapters: Chapter[] = [];
        let index = 0
        $('.row-content-chapter > li').each((_: any, element: any) => {
            const chapterId = $(element).find('a').attr('href') || ""
            const title = $(element).find('a').text().trim()
            const number = Number(title.match(/(?:Chapter|Chương|Chuong) (\d+(\.\d+)?)/i)?.[1])
            const date = $(element).find('.chapter-time').text().trim()

            chapters.push({
                chapterId,
                title,
                number,
                index,
                language: "vi-vn",
                date: new Date(date),
            });
            index++;
        })
        return chapters;
    }

    getChapterData($: CheerioAPI): ChapterData {
        const urls: string[] = [];
        $('.image-placeholder > img').each((_: any, element: any) => {
            const url = $(element).attr('data-src') || ""
            urls.push(url)
        });
        return {
            pages: urls.map((url) => ({url})),
        };
    }

    getTags($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $('.sub-menu > ul > li').each((_: any, element) => {
            const id = $(element).find('a').attr('href') || ""
            const title = $(element).find('a').text().trim()
            tags.push({id, title})
        })
        return tags
    }
}
