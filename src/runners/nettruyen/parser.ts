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

import {
    ADULT_TAGS,
    DEFAULT_IMAGE_SERVER_DOMAIN,
    IMAGE_SERVERS,
    MANGA_TYPES,
    PREF_KEYS,
    STATUS_KEYS,
    VERTICAL_TYPES,
} from "./constants";
import {GlobalStore} from "./store";
import {numberWithDot} from "../../utils/utils";


export class Parser {

    getSearchResults($: CheerioAPI, excludeSubtitle?: boolean): Highlight[] {
        const items: Highlight[] = [];
        $('div.item', 'div.row').each((_: any, manga: any) => {
            const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
            const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop() || "";
            let cover = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
            cover = !cover ? "https://i.imgur.com/GYUxEX8.png" : 'https:' + cover
            const latestChapter = $('figcaption > ul.comic-item > li.chapter:first-child > a', manga).text().trim()
            const updateTime = $('figcaption > ul.comic-item > li.chapter:first-child > i.time', manga).text().trim();
            const icons = ["👁", "💬", "📚"];
            let chapterStats = $('figure.clearfix span.pull-left', manga).text().trim();
            chapterStats = chapterStats.split(" ").filter(element => element != "").map((val, index) => `${icons[index]}` + val).join(" ");
            const chapterInfo = latestChapter + ' • ' + updateTime
            const info = chapterStats + '\n' + chapterInfo
            const subtitle = chapterStats

            const item: Highlight = {id, title, cover, info: [info]}
            if (!excludeSubtitle) {
                item.subtitle = subtitle;
            }

            items.push(item);
        });

        return items;
    }

    getPersonalList($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.item.item-read, .item.item-follow').each((_, element) => {
            const id = $(element).find('h3 a').attr("href")?.trim().split('/').pop() || "";
            const title = $(element).find('h3 a').text().trim();
            let cover = $(element).find('img').attr('data-original') || '';
            cover = !cover ? "https://i.imgur.com/GYUxEX8.png" : 'https:' + cover
            const chapterStats = $(element).find('.pull-left').text().trim();
            const icons = ["👁", "💬", "📚"];
            const subtitle = chapterStats.split(" ").filter(element => element != "").map((val, index) => `${icons[index]}` + val).join(" ");
            items.push({id, title, subtitle, cover})
        });
        return items;
    }

    getTrendingMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];

        $('div.item', 'div.altcontent1').each((_: any, manga: any) => {
            const title = $('.slide-caption > h3 > a', manga).text();
            const id = $('a', manga).attr('href')?.split('/').pop() || "";
            const cover = ($('a > img.lazyOwl', manga).attr('data-src') || "").replace(/^\/\//, "https://");

            const latestChapter = $('div.slide-caption > a', manga).text().trim()
            const updateTime = $('div.slide-caption > span', manga).text().trim()
            const info = latestChapter + ' • ' + updateTime
            items.push({id, title, info: [info], cover});
        });

        return items;
    }

    getTopMonthMangas = ($: CheerioAPI): Highlight[] => {
        const items: Highlight[] = [];

        $('#topMonth ul li').each((_: any, manga: any) => {
            const title = $('h3', manga).text().trim();
            const id = $('a', manga).first().attr('href')?.split('/').pop() || "";
            const cover = ($('img', manga).attr('data-original') || "").replace(/^\/\//, "https://");

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
            case "trending":
                return this.getTrendingMangas($)
            case "latest":
                return this.getSearchResults($, true)
            case "top_month":
                return this.getTopMonthMangas($)
        }
        return highlights;
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters: DirectoryFilter[] = [];

        const genreTags: Tag[] = [];
        const minChapterTags: Tag[] = [];
        const statusTags: Tag[] = [];
        const genderTags: Tag[] = [];

        for (const tag of $('div.col-md-3.col-sm-4.col-xs-6.mrb10', 'div.col-sm-10 > div.row').toArray()) {
            const title = $('div.genre-item', tag).text().trim();
            const id = $('div.genre-item > span', tag).attr('data-id') ?? "";
            if (!id || !title) continue;
            genreTags.push({id: id, title: title});
        }

        for (const tag of $('option', 'select.select-minchapter').toArray()) {
            const title = $(tag).text().trim();
            const id = $(tag).attr('value') ?? "";
            if (!id || !title) continue;
            minChapterTags.push({id: id, title: title});
        }

        for (const tag of $('option', '.select-status').toArray()) {
            const title = $(tag).text().trim();
            const id = $(tag).attr('value') ?? "";
            if (!id || !title) continue;
            statusTags.push({id: id, title: title});
        }

        for (const tag of $('option', '.select-gender').toArray()) {
            const title = $(tag).text().trim();
            const id = $(tag).attr('value') ?? "";
            if (!id || !title) continue;
            genderTags.push({id: id, title: title});
        }

        // genres
        filters.push({
            id: "genres",
            title: "Thể loại",
            type: FilterType.EXCLUDABLE_MULTISELECT,
            options: genreTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        // minchapter
        filters.push({
            id: "minchapter",
            title: "Số lượng chapter",
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

        // gender
        filters.push({
            id: "gender",
            title: "Dành cho",
            type: FilterType.SELECT,
            options: genderTags.map((v) => ({
                id: v.id,
                title: v.title,
            })),
        });

        return filters;
    }

    async getContent($: CheerioAPI, contentId: string): Promise<Content> {
        const scriptContent = $('script[type="text/javascript"]').first().html();
        const comicId = scriptContent?.match(/comicId=(\d+)/)?.[1] || "";
        const comicToken = scriptContent?.match(/'([^']+)'/)?.[1] || "";
        await ObjectStore.set(PREF_KEYS.comicId, comicId)
        await ObjectStore.set(PREF_KEYS.comicToken, comicToken)

        const title = $('h1.title-detail').text().trim();
        const cover = 'https:' + $('div.col-image > img').attr('src');
        const summary = $('div.detail-content > p').text();
        const status = STATUS_KEYS[$('ul.list-info > li.status > p.col-xs-8').text()];

        const genres: Tag[] = [];
        $('li.kind > p.col-xs-8 > a').each((_: any, obj: any) => {
            const title = $(obj).text();
            const id = $(obj).attr('href')?.split('/')[4] ?? "";
            if (id) {
                genres.push({id: id, title: title, nsfw: ADULT_TAGS.includes(title)});
            }
        });

        const authors: Tag[] = [];
        $('ul.list-info > li.author > p.col-xs-8 > a').each((_: any, obj: any) => {
            const title = $(obj).text();
            const id = $(obj).attr('href')?.split('?')[1] ?? "";

            if (id) {
                authors.push({id: id, title: title, nsfw: false});
            }
        });

        // Reading Mode
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        genres.forEach((item) => {
            if (VERTICAL_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })
        genres.forEach((item) => {
            if (MANGA_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.PAGED_MANGA;
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
        if (authors.length > 0) {
            properties.push({
                id: "authors",
                title: "Authors",
                tags: authors,
            });
        }

        const domain = await GlobalStore.getDomain()
        const webUrl = `${domain}/truyen-tranh/${contentId}`

        const isNSFW = genres.some((v) => v.nsfw);

        const chapters = await this.getChapters($)

        const followers = $('div.follow span').text()?.trim()?.split(' ')[1]?.split("\n")[1];
        const views = $('div.detail-info ul.list-info li.row').filter(function () {
            return $(this).find('p.name').text().trim() === 'Lượt xem' || $(this).find('p.name').text().trim() === 'Xem';
        }).find('p.col-xs-8').text().trim();
        const ratingCount = $('div.mrt5.mrb10 span[itemprop="aggregateRating"] span[itemprop="ratingCount"]').text().trim();
        const info = [
            views ? `👁️ Lượt xem: ${views}` : "",
            `📚  Lượt theo dõi: ${followers}`,
            `⭐️ Lượt đánh giá: ${numberWithDot(ratingCount)}`,

        ].filter((v) => !!v);

        return {title, cover, status, summary, recommendedPanelMode, isNSFW, webUrl, chapters, properties, info};
    }

    async getChapters($: CheerioAPI): Promise<Chapter[]> {
        const chapters: Chapter[] = [];

        const imageServerId = await GlobalStore.getImageServerName() || ""
        const providers = [
            {
                id: imageServerId,
                name: Object.fromEntries(IMAGE_SERVERS.map(e => [e.id, e.title]))[imageServerId] || ""
            },
        ]
        let index = 0
        $('div.list-chapter > nav > ul > li.row:not(.heading)').each((_: any, obj: any) => {
            const chapterId = String($('div.chapter a', obj).attr('href')).split('/').slice(-3).join('/');

            const time = $('div.col-xs-4', obj).text();
            const title = $('div.chapter a', obj).text();
            const number = parseFloat($('div.chapter a', obj).text().split(' ')[1] || "");
            const date = this.convertTime(time);

            chapters.push({
                chapterId,
                number,
                title,
                index,
                language: "vi-vn",
                date: date,
                providers,
            });
            index++;
        })
        return chapters;
    }


    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];

        const imageServerDomain = await GlobalStore.getImageServer()
        $('div.reading-detail > div.page-chapter > img').each((_: any, obj: any) => {
            if (!obj.attribs['data-original']) return;
            let link = obj.attribs['data-original'];
            const pattern = "data/images"
            if (link.includes(pattern) && imageServerDomain != DEFAULT_IMAGE_SERVER_DOMAIN) {
                link = `https://${imageServerDomain}/${link.substring(link.indexOf(pattern))}`
            }
            urls.push(link.indexOf('https') === -1 ? 'https:' + link : link);
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

    isLastPage = ($: CheerioAPI): boolean => {
        const current = $('ul.pagination > li.active > a').text();
        let total = $('ul.pagination > li.PagerSSCCells:last-child').text();

        if (current) {
            total = total ?? '';
            return (+total) === (+current);
        }
        return true;
    }
}