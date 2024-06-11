import {CheerioAPI, Element} from "cheerio"
import {DEFAULT_FILTERS, IMAGE_SERVERS, READCOMICONLINE_URL, STATUS_KEYS} from "./constants"
import {
    Chapter,
    ChapterData,
    ChapterPage,
    Content,
    DirectoryFilter,
    FilterType,
    Highlight,
    Option,
    type Property,
    ReadingMode,
    Tag,
} from "@suwatte/daisuke"
import {GlobalStore} from "./store";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.item-list>div.group').each((_: number, element: any) => {
            const id = $(element).find('.cover > a').attr('href') || "";
            const title = $(element).find('.info > p > a').text().trim()
            const subtitle = $(element).find('.info > p:nth-child(2)').text().trim()
            let cover = $(element).find('a > img').attr('src') || "";
            if (!cover.includes("https:")) {
                cover = READCOMICONLINE_URL + cover
            }
            items.push({id, title, subtitle, cover, info: [subtitle]});
        });
        return items;
    }

    getNewestComics($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.content.content.space-top>div.item-list>div.group').slice(0, 10).each((_: number, element: any) => {
            const id = $(element).find('.cover > a').attr('href') || "";
            const title = $(element).find('.info > p > a').text().trim()
            const subtitle = $(element).find('.info > p:nth-child(2)').text().trim()
            let cover = $(element).find('a > img').attr('src') || "";
            if (!cover.includes("https:")) {
                cover = READCOMICONLINE_URL + cover
            }
            items.push({id, title, cover, info: [subtitle]});
        });
        return items;
    }

    getMostPopularComics($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('.content.content.space-top>div.item-list>div.group').slice(10, 20).each((_: number, element: any) => {
            const id = $(element).find('.cover > a').attr('href') || "";
            const title = $(element).find('.info > p > a').text().trim()
            const subtitle = $(element).find('.info > p:nth-child(2)').text().trim()
            let cover = $(element).find('a > img').attr('src') || "";
            if (!cover.includes("https:")) {
                cover = READCOMICONLINE_URL + cover
            }
            items.push({id, title, subtitle, cover});
        });
        return items;
    }

    getHomepageSection($: CheerioAPI, id: string): Highlight[] {
        const highlights: Highlight[] = []
        switch (id) {
            case "new-comic":
                return this.getNewestComics($)
            case "most-popular":
                return this.getMostPopularComics($)
            case "latest":
                return this.getSearchResults($)
        }
        return highlights;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $(".red > .heading > h3").text().trim()
        let cover = $(".cover > img").attr("src") || ""
        if (!cover.includes("https:")) {
            cover = READCOMICONLINE_URL + cover
        }
        const summary = $(".section.group").eq(1).text().trim()

        const genres = $('p:contains("Genres:") > a').toArray();
        const publisher = $('p:contains("Publisher:") > a').toArray();
        const writer = $('p:contains("Writer:") > a').toArray();
        const artist = $('p:contains("Artist:") > a').toArray();

        const properties: Property[] = [];
        if (genres.length > 0) {
            properties.push({
                id: "genres",
                title: "Genres",
                tags: this.createTags($, genres),
            });
        }
        if (publisher.length > 0) {
            properties.push({
                id: "publisher",
                title: "Publisher",
                tags: this.createTags($, publisher),
            });
        }
        if (writer.length > 0) {
            properties.push({
                id: "writer",
                title: "Writer",
                tags: this.createTags($, writer),
            });
        }
        if (artist.length > 0) {
            properties.push({
                id: "artist",
                title: "Artist",
                tags: this.createTags($, artist),
            });
        }

        const recommendedPanelMode = ReadingMode.PAGED_COMIC;
        const statusText = $('p:contains("Status:")')
            .contents()
            .filter(function () {
                return this.type === 'text';
            })
            .text()
            .trim();

        const status = STATUS_KEYS[statusText]

        const views = $('p:contains("Views:")').text().trim();
        const publishDate = $('p:contains("Publication date:")').text().trim();
        const info = [
            views,
            publishDate,
        ]

        const chapters = await this.getChapters($)

        return {
            title,
            cover,
            summary,
            status,
            properties,
            chapters,
            webUrl,
            recommendedPanelMode,
            info,
        }
    }

    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const imageServerDomain = await GlobalStore.getImageServer()
        const pages: ChapterPage[] = []
        $('script').each((_: any, script: any) => {
            const scriptContent = $(script).html();
            if (scriptContent) {
                const imageMatches = scriptContent.matchAll(/lstImages\.push\(['"](.*)['"]\)/gi);
                for (const match of imageMatches) {
                    if (match[1]) {
                        let url = match[1].replace(/_x236/g, 'd').replace(/_x945/g, 'g');

                        if (url.startsWith('https')) {
                            pages.push({url});
                        } else {
                            const sliced = url.slice(url.indexOf('?'));
                            const containsS0 = url.includes('=s0');
                            url = url.slice(
                                0,
                                containsS0 ? url.indexOf('=s0?') : url.indexOf('=s1600?')
                            );
                            url = url.slice(4, 22) + url.slice(25);
                            url = url.slice(0, -6) + url.slice(-2);
                            url = Buffer.from(url, 'base64').toString('utf-8');
                            url = url.slice(0, 13) + url.slice(17);
                            url = url.slice(0, -2) + (containsS0 ? '=s0' : '=s1600');
                            pages.push({url: `${imageServerDomain}/${url + sliced}`});
                        }
                    }
                }
            }
        });
        return {
            pages
        };
    }

    async getChapters($: CheerioAPI): Promise<Chapter[]> {
        const chapters: Chapter[] = [];
        const imageServerId = await GlobalStore.getImageServerId() || ""
        const providers = [
            {
                id: imageServerId,
                name: Object.fromEntries(IMAGE_SERVERS.map(e => [e.id, e.title]))[imageServerId] || ""
            },
        ]
        let index = 0;
        $("ul.list li").each((_, element) => {
            const chapterId = $("div.col-1 a", element).attr("href");

            if (!chapterId) {
                const headingText = $("div.content div.content_top div.heading").text().trim();
                throw new Error(`Failed to parse ${index} of ${headingText}`);
            }

            const date = new Date($("div.col-2 span", element).text());
            const title = $("div.col-1 span", element).text().trim();
            const number = Number($("div.col-1", element).text()?.split("#")?.[1]) || index + 1;

            chapters.push({
                chapterId,
                date,
                title,
                number,
                index,
                language: "EN_US",
                providers,
            });

            index++;
        });

        return chapters;
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters = DEFAULT_FILTERS;
        const genres: Option[] = []
        $('#genres > li').each((_: any, cat: any) => {
            const id = $(cat).find('select').attr('gid') || ""
            const title = $(cat).find('label').text().trim()
            genres.push({id, title})
        })
        filters.push({
            id: "genre",
            title: "Genres",
            options: genres,
            type: FilterType.EXCLUDABLE_MULTISELECT
        })
        return filters
    }

    createTags($: CheerioAPI, elements: Element[]): Tag[] {
        const tags: Tag[] = []
        for (const element of elements) {
            const id = $(element).attr('href') || ""
            const title = $(element).text().trim()
            tags.push({id, title})
        }
        return tags
    }
}


