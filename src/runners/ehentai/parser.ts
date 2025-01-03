import {
    Chapter,
    Content,
    Highlight,
    HighlightCollection,
    Option,
    Property,
    PublicationStatus,
    ReadingMode,
} from "@suwatte/daisuke";
import {CheerioAPI, load} from "cheerio";
import {
    EHENTAI_DOMAIN,
    EXTENDED_DISPLAY_COOKIE,
    LANGUAGES,
    MANGA_READING_TYPES,
    PREF_KEYS,
    VERTICAL_READING_TYPES
} from "./constants";
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

    async getContent(gallery: any, $: CheerioAPI, contentId: string): Promise<Content> {
        const title = gallery.title;
        const summary = `${gallery.filecount} images`;
        const isNSFW = true;
        const cover = gallery.thumb;
        const status = PublicationStatus.ONGOING;
        let languageCode = "";

        const propertyMap = new Map<string, Property>();
        propertyMap.set("temp", {id: "temp", title: "temp", tags: []})
        propertyMap.set("uploader", {
            id: "uploader",
            title: "Uploader",
            tags: [{id: gallery.uploader, title: startCase(gallery.uploader)}]
        })

        const language_title = $('td.gdt1:contains("Language:")').next('.gdt2').text().trim().replace(/\u00a0/g, '');
        const language = LANGUAGES.find(lang => lang.label == language_title);
        languageCode = language ? `${language.languageCode}-${language.regionCode}` : languageCode;

        propertyMap.set("category", {
            id: "category",
            title: "Category",
            tags: [{id: gallery.category, title: startCase(gallery.category)}]
        })

        let recommendedPanelMode = ReadingMode.PAGED_COMIC;
        if (MANGA_READING_TYPES.includes(gallery.category.toLowerCase())) {
            recommendedPanelMode = ReadingMode.PAGED_MANGA;
        }
        let artistTag = "";
        for (const tag of gallery.tags) {
            const parts = tag.split(":");
            const id = parts[0];
            const title = parts[1];
            if (id == "artist") {
                artistTag = tag;
            }
            if (VERTICAL_READING_TYPES.includes(title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
            if (!propertyMap.has(id)) {
                propertyMap.set(id, {id: id, title: startCase(id), tags: []});
            }
            const property = propertyMap.get(id);
            property?.tags.push({id: tag, title: startCase(title)});
        }


        const chapters = this.getChapters($, gallery.filecount, gallery.posted, languageCode)

        // Related Content
        const collections: HighlightCollection[] = [];
        if (await GlobalStore.getRelatedGalleriesToggle()) {
            const relatedGalleries = await this.getRelatedGalleries(contentId, gallery.uploader, artistTag);
            if (relatedGalleries.length > 0) {
                collections.push({
                    id: "related_galleries",
                    title: "Related Galleries",
                    highlights: relatedGalleries,
                });
            }
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
            properties: Array.from(propertyMap.values()),
            info,
            collections,
        };
    }

    getChapters($: CheerioAPI, fileCount: number, date: string, languageCode: string): Chapter[] {
        const chapters: Chapter[] = [];
        const totalPages = Math.ceil(fileCount / ($('div.gt100 > a').toArray().length == 0 ? 20 : 40));
        for (let i = totalPages; i >= 1; i--) {
            chapters.push({
                chapterId: i.toString(),
                number: i,
                title: `Page ${i}`,
                index: totalPages - i,
                language: languageCode,
                date: new Date(parseInt(date, 10) * 1000),
            });
        }
        return chapters;
    }

    async getRelatedGalleries(contentId: string, uploader: string, artistTag: string): Promise<Highlight[]> {
        const [uploaderResponse, artistResponse] = await Promise.all([
            this.client.get(`${EHENTAI_DOMAIN}/uploader/${encodeURI(uploader)}`, {cookies: [EXTENDED_DISPLAY_COOKIE]}),
            this.client.get(`${EHENTAI_DOMAIN}/tag/${encodeURI(artistTag)}`, {cookies: [EXTENDED_DISPLAY_COOKIE]})
        ])
        const uploaderGalleries = await this.getSearchResults(load(uploaderResponse.data));
        const artistGalleries = await this.getSearchResults(load(artistResponse.data));
        if (artistTag) {
            return artistGalleries.filter((gallery) => gallery.id != contentId).slice(0, await GlobalStore.getNumGalleries());
        }
        return uploaderGalleries.filter((gallery) => gallery.id != contentId).slice(0, await GlobalStore.getNumGalleries());
    }


    async getImage(url: string): Promise<string> {
        const response = await this.client.get(url);
        const $ = load(response.data);
        return $('#img').attr('src') ?? ''
    }

    async parsePage($: CheerioAPI): Promise<string[]> {
        const pageDivArr = $('div.gt200 > a').toArray().length > 0
            ? $('div.gt200 > a').toArray()
            : $('div.gt100 > a').toArray();

        const pages = pageDivArr.map(page => {
            return this.getImage($(page).attr('href') ?? '');
        });

        return Promise.all(pages);
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