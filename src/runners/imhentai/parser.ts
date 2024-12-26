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
    Tag,
} from "@suwatte/daisuke";
import {Cheerio, CheerioAPI, Element} from "cheerio";

import {
    COMPLETED_STATUS_DATE_THRESHOLD,
    LANGUAGE_MAPPING,
    MANGA_READING_TYPES,
    TAG_COVER_URL,
    VERTICAL_READING_TYPES,
} from "./constants";

import {GlobalStore,} from "./store"
import {startCase} from "lodash";
import {numberWithDot} from "../../utils/utils";

export class Parser {

    async getSearchResults($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];

        for (const obj of $('div.thumb', 'div.row.galleries').toArray()) {
            const cover: string = this.getImageSrc($('img', $('div.inner_thumb', obj)).first())
            const title: string = $('h2, div.caption', obj).first().text().trim() ?? ''
            const category = $('a.thumb_cat', obj).text().trim() ?? ''
            const dataLanguages: string[] = ($(obj).attr('data-languages') ?? '').split(' ');
            const language = `${this.getLanguage(dataLanguages)}`
            const subtitle = [category, language].filter(v => (v)).join(", ")
            const id = $('h2 > a, div.caption > a', obj).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? ''

            const excludeTags = await GlobalStore.getExcludeTagIDs()
            const dataTags: number[] = ($(obj).attr('data-tags') ?? '').split(' ').map(tag => parseInt(tag, 10)).filter(tag => !isNaN(tag));
            const containsExcludedTag = dataTags.some(tag => excludeTags.includes(tag));

            if (!id || !title || containsExcludedTag) continue

            items.push({id, title, subtitle, cover});
        }
        return items;
    }

    async getContent($: CheerioAPI, chapterData: ChapterData, webUrl: string): Promise<Content> {

        const title = $("h1").text()
        const altTitle = $('p.subtitle').text()
        const additionalTitles: string[] = []
        if (altTitle) {
            additionalTitles.push(altTitle)
        }
        const genres = $('a', $('span:contains(Tags)').parent()).toArray();
        const parodies = $('a', $('span:contains(Parodies)').parent()).toArray();
        const artists = $('a', $('span:contains(Artists)').parent()).toArray();
        const characters = $('a', $('span:contains(Characters)').parent()).toArray();
        const groups = $('a', $('span:contains(Groups)').parent()).toArray();
        const languages = $('a', $('span:contains(Languages)').parent()).toArray();
        const categories = $('a', $('span:contains(Category)').parent()).toArray();

        const isNSFW = true;

        let status = PublicationStatus.ONGOING
        const timeElement = $('li.posted').text();
        const date = this.convertDate(timeElement);
        const currentDate = new Date();
        if (currentDate.getTime() - date.getTime() > COMPLETED_STATUS_DATE_THRESHOLD) {
            status = PublicationStatus.COMPLETED
        }

        let recommendedPanelMode = ReadingMode.PAGED_COMIC;

        const genreTags = this.createTags($, genres)
        const categoryTags = this.createTags($, categories)
        categoryTags.forEach((tag) => {
            if (MANGA_READING_TYPES.includes(tag.title)) {
                recommendedPanelMode = ReadingMode.PAGED_MANGA;
            }
        })
        genreTags.forEach((tag) => {
            if (VERTICAL_READING_TYPES.includes(tag.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
        })


        const properties: Property[] = [];
        properties.push(
            {
                "id": "temp",
                title: "Temp",
                tags: []
            }
        )
        if (genres.length > 0) {
            properties.push({
                id: "tags",
                title: "Tags",
                tags: genreTags,
            });
        }
        if (parodies.length > 0) {
            properties.push({
                id: "parodies",
                title: "Parodies",
                tags: this.createTags($, parodies),
            });
        }
        if (artists.length > 0) {
            properties.push({
                id: "artists",
                title: "Artists",
                tags: this.createTags($, artists),
            });
        }
        if (characters.length > 0) {
            properties.push({
                id: "characters",
                title: "Characters",
                tags: this.createTags($, characters),
            });
        }
        if (groups.length > 0) {
            properties.push({
                id: "groups",
                title: "Groups",
                tags: this.createTags($, groups),
            });
        }
        if (languages.length > 0) {
            properties.push({
                id: "languages",
                title: "Languages",
                tags: this.createTags($, languages),
            });
        }
        if (categories.length > 0) {
            properties.push({
                id: "category",
                title: "Category",
                tags: categoryTags,
            });
        }

        const coverElement = $('img.lazy').first()
        const cover = coverElement.attr('data-src') || coverElement.first().attr('src') || ""

        const chapters = await this.getChapters($, chapterData)

        const totalImages = $('li.pages').text().replace('Pages: ', '')
        const likes = $('#like_btn').text();
        const dislikes = $('#dlike_btn').text();
        const favourites = $('#add_fav_btn').text().trim().match(/\d+/)?.[0];
        const download = $('.dl_btn').text().trim().match(/\d+/)?.[0];
        const fapped = $('#fap_btn').text().trim().match(/\d+/)?.[0];
        const info = [
            `👍🏻 ${likes}  👎🏻 ${dislikes}`,
            `🤍 Favourite (${favourites})`,
            `⬇️ Download (${download})`,
            `😄 Fapped (${fapped})`,
            `🖼️ Images: ${totalImages}`,
        ]

        // Related Content
        const collections: HighlightCollection[] = [];
        const relatedGalleries = this.getRelatedGalleries($);

        if (relatedGalleries.length > 0) {
            collections.push({
                id: "related_galleries",
                title: "Related Galleries",
                highlights: relatedGalleries,
            });
        }

        return {
            title,
            additionalTitles,
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

    getRelatedGalleries($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];

        $('div.row.related div.thumb').each((_: any, gallery: any) => {
            const id = $(gallery).find('div.inner_thumb a').attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
            const title = $(gallery).find('h2.gallery_title').text().split("|")[0] || "";
            const cover = this.getImageSrc($(gallery).find('img.lazy'));
            let subtitle: string = $('a.thumb_cat', gallery).text().trim() ?? ''
            const dataLanguages: string[] = ($(gallery).attr('data-languages') ?? '').split(' ');
            subtitle += `, ${this.getLanguage(dataLanguages)}`
            if (id) {
                items.push({id, title, subtitle, cover})
            }
        });

        return items;
    }

    async getChapters($: CheerioAPI, chapterData: ChapterData): Promise<Chapter[]> {
        const chapters: Chapter[] = [];

        const languageTag = $('a', $('span:contains(Language)').parent()).first().text().trim()
        let language = 'en-gb'
        if (languageTag.includes('japanese')) {
            language = 'ja-jp'
        } else if (languageTag.includes('spanish')) {
            language = 'es-es'
        } else if (languageTag.includes('french')) {
            language = 'fr-fr'
        } else if (languageTag.includes('korean')) {
            language = 'ko-kr'
        } else if (languageTag.includes('german')) {
            language = 'de-de'
        } else if (languageTag.includes('russian')) {
            language = 'ru-ru'
        }

        const timeElement = $('li.posted').text();

        const images = chapterData.pages?.filter(v => v).map(v => String(v.url)) || []
        const numberOfImages = await GlobalStore.getNumImages()
        if (numberOfImages == 0) {
            chapters.push({
                chapterId: "chapter",
                number: 1,
                title: "Images",
                index: 1,
                language: language,
                date: this.convertDate(timeElement),
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
                language: language,
                date: this.convertDate(timeElement),
            });
        }
        return chapters;
    }


    getChapterData($: CheerioAPI): ChapterData {
        const pages: string[] = []
        const imageDir = $("#image_dir").val() as string;
        const galleryId = $("#gallery_id").val() as string;
        const imageUrl = $('#gimg').attr('data-src') as string;
        const imageServer = imageUrl.match(/:\/\/(www\.)?(.[^/]+)/)?.[2] || '';

        const scriptContent = $("script").filter((_, el) => {
            return $(el).text().includes("var g_th");
        }).text();

        const imageData = scriptContent.split("$.parseJSON('")[1]?.split("');")[0]?.trim() || "";
        const images = JSON.parse(imageData) as { [key: string]: string };

        for (const key in images) {
            if (Object.prototype.hasOwnProperty.call(images, key)) {
                const iext = images[key]?.replace(/"/g, "").split(",")[0];
                const iextPr = (iext === "p") ? "png" : (iext === "b") ? "bmp" : (iext === "g") ? "gif" : (iext === "w") ? "webp" : "jpg";
                const imageUrl = `https://${imageServer}/${imageDir}/${galleryId}/${key}.${iextPr}`;
                pages.push(imageUrl);
            }
        }

        return {
            pages: pages.map((url) => ({url})),
        };
    }


    convertDate = (timeElement: string): Date => {
        // Extract the time value using a regular expression
        const match = /(\d+) (\w+) ago/.exec(timeElement);

        if (match) {
            const value = match[1] ? parseInt(match[1]) : 0;
            const unit = match[2];

            // Calculate the time in milliseconds based on the unit
            let timeInMilliseconds = 0;
            if (unit === 'seconds') {
                timeInMilliseconds = value * 1000;
            } else if (unit === 'minutes') {
                timeInMilliseconds = value * 60 * 1000;
            } else if (unit === 'hours') {
                timeInMilliseconds = value * 60 * 60 * 1000;
            } else if (unit === 'days') {
                timeInMilliseconds = value * 24 * 60 * 60 * 1000;
            } else if (unit === 'weeks') {
                timeInMilliseconds = value * 7 * 24 * 60 * 60 * 1000;
            } else if (unit === 'months') {
                // Approximate number of days in a month
                timeInMilliseconds = value * 30 * 24 * 60 * 60 * 1000;
            } else if (unit === 'years') {
                // Approximate number of days in a year
                timeInMilliseconds = value * 365 * 24 * 60 * 60 * 1000;
            }


            // Calculate the posting date by subtracting timeInMilliseconds from the current date
            const currentDate = new Date();
            return new Date(currentDate.getTime() - timeInMilliseconds);
        } else {
            return new Date()
        }
    };

    createTags($: CheerioAPI, elements: Element[]): Tag[] {
        const tags: Tag[] = []
        for (const element of elements) {
            tags.push(
                {
                    title: startCase($(element).text().trim().replace(/(\d+\s*)+$/, '').trim()),
                    id: $(element).attr('href') || "",
                });
        }
        return tags
    }

    getImageSrc(imageObj: Cheerio<Element> | undefined): string {
        let image
        if (typeof imageObj?.attr('data-src') != 'undefined') {
            image = imageObj?.attr('data-src')
        } else {
            image = imageObj?.attr('src')
        }
        return image?.trim() || ""
    }

    isLastPage = ($: CheerioAPI): boolean => {
        let isLast = false
        const hasEnded = $('li.page-item', 'ul.pagination').last().attr('class')
        if (hasEnded === 'page-item disabled') isLast = true
        return isLast;
    }

    getLanguage = (dataLanguages: string[]): string => {
        const sortedDataLanguages = dataLanguages.sort(); // Sort the languages numerically if necessary

        for (const language of sortedDataLanguages) {
            const code = LANGUAGE_MAPPING[language];
            if (code && code !== "UNKNOWN") {
                return code;
            }
        }
        return "UNKNOWN";
    };

    getTags($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $('div.row.stags div.col').each((_index: any, element: any) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('a>h3').text();
            tags.push({id, title: startCase(title)})
        })
        return tags
    }

    async getTagAsHighLights($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = []
        $('div.row.stags div.col').each((_index: any, element: any) => {
            const id = $(element).find('a').attr('href') || "";
            const title = $(element).find('a>h3').text();
            const count = $(element).find('span.badge').text();
            const subtitle = `📚 ${numberWithDot(count)}`
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
