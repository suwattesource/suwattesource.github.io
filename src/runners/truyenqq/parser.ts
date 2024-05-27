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
import {CheerioAPI} from "cheerio";

import {ADULT_TAGS, STATUS_KEYS, VERTICAL_TYPES,} from "./constants";
import {numberWithDot} from "../../utils/utils";


export class Parser {
    getSearchResults($: CheerioAPI, excludeSubtitle?: boolean): Highlight[] {
        const items: Highlight[] = [];
        $('ul.list_grid.grid > li').each((_: any, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('div.book_name.qtip').text().trim()
            const cover = $(element).find('a>img').attr('src') || ""
            const chapterStats = $('.text_detail', element).text().trim();
            const totalViews = `👁️ ${chapterStats.split(" ").filter(element => element.trim() !== "")[1]}`
            const lastChapter = $(element).find("div.last_chapter>a").text()
            const subtitle = [totalViews, lastChapter].join(" • ")
            const item: Highlight = {id, title, cover}
            const categories = $(element).find('div.list-tags p').map((_: any, elem: any) => $(elem).text()).get().join(', ');
            const info = categories.match(/.{1,32}(,\s|$)|.{1,32}$/g) || [];
            const chapterNumber = $(element).find('div.last_chapter a').text();
            const timeAgo = $(element).find('div.top-notice span.time-ago').text();
            const lastChapterInfo = `${chapterNumber}  🕒 ${timeAgo}`
            info.splice(0, 0, lastChapterInfo);
            item.info = info.map(i => i.trim());
            if (!excludeSubtitle) {
                item.subtitle = subtitle;
            }
            if (title) items.push(item);
        });

        return items;
    }

    getTrendingMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];
        $('div#div_suggest > ul.list_grid.grid > li').each((_: any, element: any) => {
            const id = $(element).find('a').first().attr('href') || ""
            const title = $(element).find('div.book_name').text().trim()
            const cover = $(element).find('a>img').attr('src') || ""
            const chapterNumber = $(element).find('div.last_chapter a').text();
            const timeAgo = $(element).find('div.top-notice span.time-ago').text();
            const lastChapterInfo = `${chapterNumber}  🕒 ${timeAgo}`
            if (id) items.push({id, title, cover, info: [lastChapterInfo]});
        });

        return items;
    }

    getHomepageSection($: CheerioAPI, id: string): Highlight[] {
        const highlights: Highlight[] = []
        switch (id) {
            case "suggested":
                return this.getTrendingMangas($)
            case "favorite":
            case "latest":
            case "top_month":
                return this.getSearchResults($, true)
        }
        return highlights;
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters: DirectoryFilter[] = [];

        const categoryTags: Tag[] = [];
        const minChapterTags: Tag[] = [];
        const statusTags: Tag[] = [];
        const countryTags: Tag[] = [];

        $('div.genre-item').each((_, element) => {
            const title = $(element).text().trim();
            const id = $(element).find('span.icon-checkbox').attr('data-id');
            if (id && title) {
                categoryTags.push({id, title});
            }
        });


        $('select#minchapter option').each((_, element) => {
            const title = $(element).text().trim();
            const id = $(element).attr('value');
            if (id && title) {
                minChapterTags.push({id, title});
            }
        });

        $('select#status option').each((_, element) => {
            const title = $(element).text().trim();
            const id = $(element).attr('value');
            if (id && title) {
                statusTags.push({id, title});
            }
        });

        $('select#country option').each((_, element) => {
            const title = $(element).text().trim();
            const id = $(element).attr('value');
            if (id && title) {
                countryTags.push({id, title});
            }
        });

        // category
        filters.push({
            id: "category",
            title: "Thể loại",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: categoryTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        // country
        filters.push({
            id: "country",
            title: "Quốc gia",
            type: FilterType.SELECT,
            options: countryTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        // minchapter
        filters.push({
            id: "minchapter",
            title: "Số lượng chương",
            type: FilterType.SELECT,
            options: minChapterTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        // status
        filters.push({
            id: "status",
            title: "Tình trạng",
            type: FilterType.SELECT,
            options: statusTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        return filters;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $('h1[itemprop="name"]').text().trim();
        const cover = $('img[itemprop="image"]').attr('src') || "";

        const summary = $('.story-detail-info.detail-content')
            .map((_, element) => $(element).text().trim())
            .get()
            .find(text => text.length > 0)?.trim() || "";
        const categories: Tag[] = [];
        $('ul.list01 > li > a').each((_: any, element: any) => {
            const title = $(element).text();
            const id = $(element).attr('href')
            if (id) {
                categories.push({id: id, title: title, nsfw: ADULT_TAGS.includes(title)});
            }
        });

        const authors: Tag[] = [];
        $('li.author.row > p.col-xs-9 > a').each((_: any, element: any) => {
            const title = $(element).text();
            const id = $(element).attr('href') || "";
            if (id) {
                authors.push({id: id, title: title, nsfw: false});
            }
        });

        const otherNameElement = $('.othername .other-name');
        let additionalTitles: string[] = []
        let child = 4;
        if (otherNameElement.length > 0) {
            child = 5;
            additionalTitles = otherNameElement.text().trim().split(';').map(v => v.trim())
        }

        const likes = $('.number-like').text().trim();
        const followers = $(`.list-info li:nth-child(${child}) .col-xs-9`).text().trim();
        const views = $(`.list-info li:nth-child(${child + 1}) .col-xs-9`).text().trim();
        const info = [
            views ? `👁️ Lượt xem: ${views}` : "",
            `❤️ Lượt theo dõi: ${followers}`,
            `👍 Lượt thích: ${numberWithDot(likes)}`,

        ].filter((v) => !!v);

        // Reading Mode
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        categories.forEach((item) => {
            if (VERTICAL_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })

        const properties: Property[] = [];
        if (categories.length > 0) {
            properties.push({
                id: "category",
                title: "Categories",
                tags: categories,
            });
        }
        if (authors.length > 0) {
            properties.push({
                id: "author",
                title: "Authors",
                tags: authors,
            });
        }

        const isNSFW = categories.some((v) => v.nsfw);

        const statusText = $(".status.row > p.col-xs-9").text().trim()
        const status = STATUS_KEYS[statusText];


        const chapters = await this.getChapters($)

        return {
            title,
            cover,
            summary,
            recommendedPanelMode,
            isNSFW,
            status,
            webUrl,
            chapters,
            properties,
            info,
            additionalTitles
        };
    }

    async getChapters($: CheerioAPI): Promise<Chapter[]> {
        const chapters: Chapter[] = [];
        let index = 0
        $('div.works-chapter-list > div.works-chapter-item').each((_: any, element: any) => {
            const chapterId = $(element).find('a').attr('href') || ""
            const title = $(element).find('a').text().trim()
            const number = Number(title.match(/(?:Chuong|Chương) (\d+(\.\d+)?)/i)?.[1] || "0")
            const time = $(element).find('div').next().text().trim()
            const date = this.convertTime(time);
            chapters.push({
                chapterId,
                number,
                index,
                title,
                language: "vi-vn",
                date: date,
            });
            index++;
        })
        return chapters;
    }

    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];
        $('div.page-chapter > img').each((_: any, element: any) => {
            const url = $(element).attr('data-original') || "";
            urls.push(url);
        });
        return {
            pages: urls.map((url) => ({url})),
        };
    }

    convertTime = (dateString: string): Date => {
        const [day, month, year] = dateString.split("/").map(Number);
        if (!year || !month || !day) {
            return new Date()
        }
        return new Date(year, month - 1, day);
    }
}