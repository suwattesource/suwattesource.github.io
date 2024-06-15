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
import {LANGUAGES, TAG_COVER_URL, TAG_TYPES, typeOfImage} from "./constants";
import {Gallery} from "./type";
import {GlobalStore} from "./store";
import {startCase} from "lodash";
import {CheerioAPI} from "cheerio";
import {getLanguage} from "./utils";

export class Parser {

    async getSearchResults(galleries: Gallery[], excludeSubtitle?: boolean): Promise<Highlight[]> {
        const items: Highlight[] = [];
        const excludedTags = await GlobalStore.getExcludeTags()
        for (const gallery of galleries) {
            const languages = gallery.tags
                .filter(tag => tag.type === "language" && tag.name !== "translated")
                .map(tag => startCase(tag.name));

            const containsExcludedTag = gallery.tags.filter(tag => tag.type == "tag").map(tag => tag.id).some(tag => excludedTags.includes(tag.toString()))

            const subtitle = languages.join(", ");

            const item: Highlight = {
                id: gallery.id.toString(),
                title: gallery.title.pretty,
                cover: this.getCover(gallery),
                info: [subtitle]
            };

            if (!excludeSubtitle) {
                item.subtitle = subtitle;
            }

            if (!containsExcludedTag) {
                items.push(item);
            }
        }
        return items;
    }

    async getGalleriesFromCheerio($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];
        $('div.container.index-container div').each((_: any, manga: any) => {
            const id = $(manga).find('a').attr('href')?.split('/')[2]
            const title = $(manga).find('div.caption').text().trim()
            const cover = $(manga).find('img').attr('data-src') || "";
            const dataTags = $(manga).attr("data-tags")?.split(" ").map(v => Number(v))
            let language = ""
            if (dataTags) {
                language = getLanguage(dataTags)
            }
            if (id) {
                items.push({id, title, cover, info: [language]})
            }
        });

        return items;
    }


    async getContent(gallery: Gallery, chapterData: ChapterData, similarGalleries: Gallery[], webUrl: string): Promise<Content> {
        const title = gallery.title.pretty
        const summary = `${gallery.num_pages} images`
        const isNSFW = true;
        const cover = this.getCover(gallery)
        const status = PublicationStatus.ONGOING
        const propertyMap = new Map<string, Property>();
        const languageName = gallery.tags
            .find(tag => tag.type == "language" && tag.name !== "translated")
            ?.name || "";

        const language = LANGUAGES.find(lang => lang.label.toLowerCase() == languageName);
        const languageCode = language ? `${language.languageCode}-${language.regionCode}` : "";


        propertyMap.set("temp", {id: "temp", title: "temp", tags: []})
        TAG_TYPES.forEach(
            (tagType) => {
                propertyMap.set(tagType.id, {id: tagType.id, title: tagType.title, tags: []})
            }
        )

        let isWebtoon = false;
        for (const tag of gallery.tags) {
            if (tag.type == "tag" && tag.name == "webtoon") isWebtoon = true;
            const property = propertyMap.get(tag.type);
            property?.tags.push({id: tag.id.toString(), title: startCase(tag.name)});
        }

        const properties = Array.from(propertyMap.values()).filter((property) => (property.id == "temp" || property.tags.length > 0))

        const recommendedPanelMode = isWebtoon ? ReadingMode.WEBTOON : ReadingMode.PAGED_MANGA;

        const info = [
            `♥️Favorite: ${gallery.num_favorites}`
        ]

        const chapters = await this.getChapters(chapterData, gallery.upload_date, languageCode)

        const collections: HighlightCollection[] = [];
        if (similarGalleries.length > 0) {
            collections.push({
                id: "similar_galleries",
                title: "Similar Galleries",
                highlights: await this.getSearchResults(similarGalleries),
            });
        }

        return {
            title,
            summary,
            cover,
            status,
            recommendedPanelMode,
            isNSFW,
            webUrl,
            chapters,
            properties,
            info,
            collections
        };
    }

    async getChapters(chapterData: ChapterData, date: number, languageCode: string): Promise<Chapter[]> {
        const chapters: Chapter[] = [];
        const images = chapterData.pages?.filter(v => v).map(v => String(v.url)) || []
        const numberOfImages = await GlobalStore.getNumImages()
        if (numberOfImages == 0) {
            chapters.push({
                chapterId: "chapter",
                number: 1,
                title: "Images",
                index: 1,
                language: languageCode,
                date: new Date(date * 1000),
            });
            return chapters;
        }

        const numberOfChapters = Math.ceil(images.length / numberOfImages);
        for (let i = numberOfChapters; i >= 1; i--) {
            chapters.push({
                chapterId: i.toString(),
                number: i,
                title: `Image ${(i - 1) * numberOfImages + 1} - ${Math.min(i * numberOfImages, images.length)}`,
                index: numberOfChapters - i,
                language: languageCode,
                date: new Date(date * 1000),
            });
        }
        return chapters;
    }


    getChapterData(gallery: Gallery): ChapterData {
        const pages = this.getImages(gallery)
        return {
            pages: pages.map((url) => ({url})),
        };
    }

    getCover(gallery: Gallery): string {
        return `https://t.nhentai.net/galleries/${gallery.media_id}/cover.${typeOfImage(gallery.images.cover)}`
    }

    getImages(gallery: Gallery): string[] {
        return gallery.images.pages.map((image: any, i: any) => {
            const type = typeOfImage(image)
            return `https://i.nhentai.net/galleries/${gallery.media_id}/${i + 1}.${type}`
        })
    }

    getTags($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $('div.container a').each((_index: any, element: any) => {
            const id = $(element).attr("class")?.match(/tag-(\d+)/)?.[1] || "";
            const title = $(element).find('span.name').text();
            tags.push({id, title: startCase(title)})
        })
        return tags
    }

    getTagAsHighLights($: CheerioAPI): Highlight[] {
        const items: Highlight[] = []
        $('div.container a').each((_index: any, element: any) => {
            const id = $(element).attr("class")?.match(/tag-(\d+)/)?.[1] || "";
            const title = $(element).find('span.name').text();
            const count = $(element).find('span.count').text();
            const subtitle = `📚 ${count}`
            items.push({
                id,
                title: startCase(title),
                subtitle: subtitle,
                cover: TAG_COVER_URL,
                link: {
                    request: {
                        page: 1,
                        tag: {
                            tagId: id,
                            propertyId: "tags"
                        }
                    }
                }
            })
        })
        return items
    }
}
