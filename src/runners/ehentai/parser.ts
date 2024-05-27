import {
    Chapter,
    ChapterData,
    Content,
    Highlight,
    HighlightCollection,
    Option,
    Property,
    PublicationStatus,
    ReadingMode,
} from "@suwatte/daisuke";
import {CheerioAPI, load} from "cheerio";
import {EHENTAI_DOMAIN, LANGUAGES, MANGA_READING_TYPES, PREF_KEYS, VERTICAL_READING_TYPES} from "./constants";
import {GlobalStore} from "./store";
import {startCase} from "lodash";

export class Parser {

    private client = new NetworkClient();


    async getHomepageSection($: CheerioAPI, id: string): Promise<Highlight[]> {
        const highlights: Highlight[] = []
        switch (id) {
            case "popular":
                return this.getPopularGalleries($)
            case "front_page":
                return (await this.getSearchResults($)).slice(0, 16)
            default:
        }
        return highlights;
    }

    async getPopularGalleries($: CheerioAPI): Promise<Highlight[]> {
        const items = await this.getSearchResults($)
        return items.map((item) => {
            return {id: item.id, title: item.title, cover: item.cover, info: [item.subtitle || ""]}
        })
    }

    async getSearchResults($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];

        const excludeTags = await GlobalStore.getExcludeTags()
        $('table.itg.glte tbody tr').each((_index: any, element: any) => {
            const $element = $(element);
            const idElement = $element.find('.gl1e a').attr("href");
            const id = idElement ? `${idElement.split('/').slice(-3, -1).join('/')}` : "";

            const title = $element.find('.glname .glink').text().trim();
            const subtitle = $element.find('.gl3e div').first().text().trim();
            const imageElement = $element.find('.gl1e img')
            const cover = imageElement.attr("data-src") ?? imageElement.attr("src") ?? ""

            const tags = $element.find(".gl4e tbody div").toArray().map((element) => {
                return element.attribs["title"] || ""
            })
            const containsExcludedTag = tags.some(tag => excludeTags.includes(tag));


            if (id && title && !containsExcludedTag) {
                items.push({
                    id,
                    cover,
                    title,
                    subtitle,
                    info: [subtitle]
                });
            }
        });
        return items;
    }

    async getToplistGalleries($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];

        const excludeTags = await GlobalStore.getExcludeTags()
        $('table.itg tbody tr').each((_index: any, element: any) => {
            const $element = $(element);
            const idElement = $element.find('.glname a').attr('href');
            const id = idElement ? `${idElement.split('/').slice(-3, -1).join('/')}` : "";

            const title = $element.find('.glname .glink').text().trim();
            const subtitle = $element.find('.gl1c .cn').text().trim();
            const imageElement = $element.find('.glthumb img')
            const cover = imageElement.attr("data-src") ?? imageElement.attr("src") ?? ""

            const tags = $element.find("td.gl3c.glname div").toArray().map((element) => {
                return element.attribs["title"] || ""
            })
            const containsExcludedTag = tags.some(cat => excludeTags.some(excludeTag => cat.includes(excludeTag)));


            if (id && title && !containsExcludedTag) {
                items.push({
                    id,
                    cover,
                    title,
                    subtitle
                });
            }
        });
        return items;
    }

    async getContent(gallery: any, relatedGalleriesCheerio: CheerioAPI, contentId: string): Promise<Content> {
        const title = gallery.title;

        const summary = `${gallery.filecount} images`;
        const isNSFW = true;
        const cover = gallery.thumb;
        let status = PublicationStatus.ONGOING;
        let languageCode = "";

        const propertyMap = new Map<string, Property>();
        propertyMap.set("temp", {id: "temp", title: "temp", tags: []})
        propertyMap.set("uploader", {
            id: "uploader",
            title: "Uploader",
            tags: [{id: gallery.uploader, title: startCase(gallery.uploader)}]
        })

        propertyMap.set("category", {
            id: "category",
            title: "Category",
            tags: [{id: gallery.category, title: startCase(gallery.category)}]
        })

        let recommendedPanelMode = ReadingMode.PAGED_COMIC;
        if (MANGA_READING_TYPES.includes(gallery.category.toLowerCase())) {
            recommendedPanelMode = ReadingMode.PAGED_MANGA;
        }
        for (const tag of gallery.tags) {
            const parts = tag.split(":");
            const id = parts[0];
            const title = parts[1];
            if (VERTICAL_READING_TYPES.includes(title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
            if (id == "language" && title != "translated") {
                const language = LANGUAGES.find(lang => lang.label == title);
                languageCode = language ? `${language.languageCode}-${language.regionCode}` : languageCode;
            }
            if (!propertyMap.has(id)) {
                propertyMap.set(id, {id: id, title: startCase(id), tags: []});
            }
            const property = propertyMap.get(id);
            property?.tags.push({id: tag, title: startCase(title)});
        }


        const chapters = this.getChapters(gallery.filecount, gallery.posted, languageCode)

        // Related Content
        const collections: HighlightCollection[] = [];
        const relatedGalleries = await this.getSearchResults(relatedGalleriesCheerio);

        if (relatedGalleries.length > 0) {
            collections.push({
                id: "related_galleries",
                title: "Related Galleries",
                highlights: relatedGalleries.filter(gallery => gallery.id != contentId),
            });
        }

        const info = [
            `⭐️ Rating: ${Number(gallery.rating).toFixed(2)} / 5`,
        ]

        const webUrl = `${EHENTAI_DOMAIN}/g/${contentId}`

        return {
            title,
            summary,
            cover,
            status,
            recommendedPanelMode,
            isNSFW,
            webUrl,
            chapters,
            collections,
            properties: Array.from(propertyMap.values()),
            info,
        };
    }

    getChapters(fileCount: number, date: string, languageCode: string): Chapter[] {
        const chapters: Chapter[] = [];
        chapters.push({
            chapterId: fileCount.toString(),
            number: 1,
            title: "Images",
            index: 1,
            language: languageCode,
            date: new Date(parseInt(date, 10) * 1000),
        });
        return chapters;
    }


    async getChapterData(contentId: string, numberCount: number): Promise<ChapterData> {
        const pages = await this.parsePages(contentId, numberCount)

        return {
            pages: pages.map((url) => ({url})),
        };
    }

    async getImage(url: string): Promise<string> {
        const response = await this.client.get(url);
        const $ = load(response.data);
        return $('#img').attr('src') ?? ''
    }

    async parsePage(id: string, page: number): Promise<string[]> {
        const response = await this.client.get(`https://e-hentai.org/g/${id}/?p=${page}`);
        const $ = load(response.data);

        const pages: Promise<string>[] = []
        const pageDivArr = $('div.gdtm').toArray()

        for (const page of pageDivArr) {
            pages.push(this.getImage($('a', page).attr('href') ?? ''))
        }

        return Promise.all(pages)
    }

    async parsePages(id: string, pageCount: number): Promise<string[]> {
        const iterations = Math.ceil(pageCount / 40);
        const maxWorkers = await GlobalStore.getWorkerCount();

        const results: string[][] = []; // Store results in a nested array
        let nextIteration = 0;

        const worker = async () => {
            while (nextIteration < iterations) {
                const taskIndex = nextIteration++;
                results[taskIndex] = await this.parsePage(id, taskIndex);
            }
        }

        const workerPromises = [];
        for (let i = 0; i < maxWorkers; i++) {
            workerPromises.push(worker());
        }

        await Promise.all(workerPromises);
        return results.flat();
    }

    getNextId = async ($: CheerioAPI): Promise<string> => {
        let nextId = "0"
        const nextLinkUrl = $('.searchnav #unext').attr('href');
        if (nextLinkUrl) {
            const idString = nextLinkUrl.split('next=')[1] || "0";
            if (idString) {
                nextId = idString
            }
        }
        await ObjectStore.set(PREF_KEYS.cache_next_id, nextId)
        return nextId
    }

    getTags($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $('tbody td a').each((_index: any, element: any) => {
            const id = $(element).text()
            const title = id
            tags.push({id, title})
        })
        return tags
    }
}
