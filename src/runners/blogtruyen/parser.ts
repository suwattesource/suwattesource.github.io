import {
    Chapter,
    ChapterData,
    Content,
    DirectoryFilter,
    FilterType,
    Highlight,
    HighlightCollection,
    Option,
    Property,
    ReadingMode,
    Tag,
} from "@suwatte/daisuke";
import {CheerioAPI, Element} from "cheerio";
import {COMIC_TYPES, DEFAULT_FILTERS, STATUS_KEYS, VERTICAL_TYPES} from "./constants";
import {numberWithDot} from "../../utils/utils";
import {upperFirst} from "lodash";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.list').children('p, div').each((index: number, element: any) => {
            if (index % 2 === 1) {
                const id = $(element).find('a').attr('href') || ""
                const title = $(element).find('a').text().trim()
                const cover = $(element).next('div').find('img').attr('src') || ""
                let totalChapters = $(element).find('span.fs-12:nth-child(2)').text().trim()
                totalChapters = `${totalChapters} chương`
                let totalViews = $(element).find('span.fs-12:nth-child(3)').text().trim()
                totalViews = `👁️ ${numberWithDot(totalViews)}`
                const subtitle = [totalViews, totalChapters].join(' • ')
                if (id) items.push({id, title, cover, subtitle})
            }
        });
        return items;
    }

    getUploadMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('tr').each((_, element) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('a').text().trim();
            const cover = $(element).find('img').attr('src') || "";
            const totalChapters = $(element).find('td').eq(1).text().trim();
            const totalViews = $(element).find('td').eq(2).text().trim();

            const subtitle = `👁️ ${numberWithDot(totalViews)} • ${totalChapters} chương`;

            if (id) items.push({id, title, cover, subtitle});
        });
        return items;
    }

    getTrendingMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('article').children('a, div').each((index: number, element: any) => {
            if (index % 2 === 0 && $(element).attr('href')) {
                const id = $(element).attr('href') || "";
                const cover = $(element).find('img').attr('src') || ""
                const title = $(element).next('div').find('p').first().text()
                items.push({id, title, cover})
            }
        });
        return items;
    }

    getTopMangas($: CheerioAPI, id: string): Highlight[] {
        const items: Highlight[] = [];
        $(`div#tabs-${id} > p`).each((_: any, element: any) => {
            const id = $(element).find('span.ellipsis > a').attr('href') || "";
            const views = $(element).find('span.fl-r').text();
            let title = $(element).find('span.ellipsis > a').attr('title') || "";
            title = `${title} [${views} lượt xem]`
            const cover = ""
            items.push({id, title, cover})
        });
        return items;
    }

    getHotMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('ul.list-unstyled.list-manga.row>li').each((_: any, element: any) => {
            const id = $(element).find('div.title>a').attr('href') || "";
            const title = $(element).find('div.title>a').text().trim();
            const cover = $(element).find('img').attr("src") || ""
            items.push({id, title, cover})
        });
        return items;
    }

    getNewMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('#top-newest-story > a').each((_: any, element: any) => {
            const id = $(element).attr('href') || "";
            const title = $(element).attr('title') || "";
            const cover = $(element).find('img').attr('src') || ""
            items.push({id, title, cover})
        });
        return items;
    }

    getNewUpdateMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.col-sm-12').each((_: any, element: any) => {
            const id = $(element).find('a').attr('href');
            const title = $(element).find('a').attr('title') || "";
            const cover = $(element).find('a > img').attr('src') || ""
            const totalChapter = $(element).find('span.color-red').first().text().trim()
            const publishedDate = $(element).find('span.publishedDate').text()
            const categories = $(element).find("div.category > a").map((_, elem) => $(elem).text()).get().join(", ");
            const info = categories.match(/.{1,32}(,\s|$)|.{1,32}$/g) || [];
            info.splice(0, 0, `${totalChapter} chương  🕒 ${publishedDate}`);
            if (id && !id.includes("blogtruyen")) items.push({id, title, cover, info: info.map(i => i.trim())})
        });
        return items;
    }

    getHomepageSection($: CheerioAPI, id: string): Highlight[] {
        const highlights: Highlight[] = []
        switch (id) {
            case "trending":
                return this.getTrendingMangas($)
            case "top-hot":
                return this.getHotMangas($)
            case "top-week":
                return this.getTopMangas($, id)
            case "new-manga":
                return this.getNewMangas($).slice(0, 14)
            case "new-update":
                return this.getNewUpdateMangas($)
        }
        return highlights;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $("h1.entry-title").text().trim();
        const cover = $("div.thumbnail > img").attr('src') || "";
        const summary = $("div.content").text().trim();

        const additionalTitles = $('p:contains("Tên khác:") > span').text().split(';').filter(v => v.trim())
        const authors = $('p:contains("Tác giả:") > a').toArray();
        const translator = $('p:contains("Nhóm dịch:") > span > a').toArray();
        const categories = $('p:contains("Thể loại:") > span > a').toArray();
        const uploader = $('p:contains("Đăng bởi:") > a').toArray();

        const categoryTags = this.createTags($, categories, true);

        const properties: Property[] = [];

        if (categories.length > 0) {
            properties.push({
                id: "categories",
                title: "Thể loại",
                tags: categoryTags,
            });
        }
        if (authors.length > 0) {
            properties.push({
                id: "authors",
                title: "Tác giả",
                tags: this.createTags($, authors),
            });
        }
        if (translator.length > 0) {
            properties.push({
                id: "translator",
                title: "Nhóm dịch",
                tags: this.createTags($, translator),
            });
        }
        if (uploader.length > 0) {
            properties.push({
                id: "uploader",
                title: "Đăng bởi",
                tags: this.createTags($, uploader),
            });
        }

        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        categoryTags.forEach((item) => {
            if (VERTICAL_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })
        categoryTags.forEach((item) => {
            if (COMIC_TYPES.includes(item.title)) {
                recommendedPanelMode = ReadingMode.PAGED_MANGA;
            }
        })

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

        const views = $('span#PageViews').text();
        const followers = $('span#LikeCount').text();
        const info = [
            `👁️ Số lượt xem: ${numberWithDot(views)}`,
            `❤️ Theo dõi: ${numberWithDot(followers)}`,
        ]

        const status = STATUS_KEYS[$('p:contains("Trạng thái:") > span').text().trim()];

        const chapters = this.getChapters($)

        return {
            title,
            additionalTitles,
            cover,
            summary,
            webUrl,
            recommendedPanelMode,
            collections,
            chapters,
            properties,
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
        let reassign = false
        $('#list-chapters > p').each((_: any, element: any) => {
            const chapterId = $(element).find('a').attr('href') || ""
            const title = $(element).find('a').attr('title')?.trim() || ""
            let number = Number(title.match(/(?:Chap|Chapter|Chương|Chuong) (\d+(\.\d+)?)/i)?.[1])
            const date = $(element).find('span.publishedDate').text().trim() || ""

            if (!number) {
                number = 0
                reassign = true
            }
            chapters.push({
                chapterId,
                title,
                number,
                index,
                language: "vi-vn",
                date: this.convertDate(date),
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
        return chapters;
    }

    getChapterData($: CheerioAPI): ChapterData {
        let urls: string[] = [];
        $('article#content > img').each((_: any, element: any) => {
            const url = $(element).attr('src') || ""
            urls.push(url)
        });
        if (urls.length == 0) urls = this.getChapterDataFromScript($)

        return {
            pages: urls.map((url) => ({url})),
        };
    }

    getChapterDataFromScript($: CheerioAPI): string[] {
        const scriptTags = $('script');

        let imageUrls: string[] = [];

        scriptTags.each((index, element) => {
            const scriptContent = $(element).html();

            // Check if the script content contains 'listImageCaption'
            if (scriptContent && scriptContent.includes('var listImageCaption')) {
                // Extract the JSON part from the script content using a regular expression
                const regex = /var listImageCaption = (\[.*\]);/;
                const match = regex.exec(scriptContent);

                if (match && match[1]) {
                    // Parse the JSON string
                    const listImageCaption = JSON.parse(match[1]);

                    // Extract the URLs
                    imageUrls = listImageCaption.map((item: { url: string }) => item.url);
                }
            }
        });
        return imageUrls
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters = DEFAULT_FILTERS;
        const categories: Option[] = []
        $("ul.list-unstyled.row li").each((_: any, cat: any) => {
            const id = $(cat).attr('data-id') || ""
            const title = upperFirst($(cat).text().trim())
            categories.push({id, title})
        })
        filters.push({
            id: "categories",
            title: "Chọn thể loại",
            options: categories,
            type: FilterType.EXCLUDABLE_MULTISELECT
        })
        return filters
    }

    createTags($: CheerioAPI, elements: Element[], titleAsId?: boolean): Tag[] {
        const tags: Tag[] = []
        for (const element of elements) {
            let id = $(element).attr('href') || ""
            let title = $(element).text().trim()
            if (!title) {
                title = "Đang cập nhật"
            }
            if (titleAsId) {
                id = title = upperFirst(title)
            }

            tags.push({id, title})
        }
        return tags
    }

    convertDate(dateString: string): Date {
        const date = dateString.split(" ")[0] || ""
        const [day, month, year] = date.split("/").map(Number);
        if (!year || !month || !day) {
            return new Date()
        }
        return new Date(year, month - 1, day)
    }
}