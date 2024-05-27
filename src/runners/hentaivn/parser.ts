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
    PublicationStatus,
    ReadingMode,
    Tag
} from "@suwatte/daisuke";
import {CheerioAPI, Element} from "cheerio";

import {
    COMIC_TYPES,
    DEFAULT_FILTERS,
    IMAGE_SERVERS,
    REPLACEABLE_IMAGE_SERVER_DOMAIN,
    VERTICAL_TYPES
} from "./constants";
import {GlobalStore} from "./store";

export class Parser {

    getBlockTopMangas = ($: CheerioAPI, divId: string): Highlight[] => {
        const items: Highlight[] = [];

        $('ul > li > div', divId).each((_: any, manga: any) => {
            const title = $('h2', manga).attr('title') || "";
            const id = $('a', manga).attr('href')?.split('/').pop() || "";
            const coverStyle = $('div', manga).attr('style') || "";
            const coverMatch = coverStyle.match(/url\(['"]?(.*?)['"]?\)/);
            const cover = (coverMatch ? coverMatch[1] : "") || "";
            const subtitle = $('span.info-detail > a', manga).text().trim();
            if (id) {
                items.push({id, title, info: [subtitle], cover});
            }
        });

        return items;
    }

    getTrendingMangas($: CheerioAPI) {
        return this.getBlockTopMangas($, "#myDIV")
    }

    getHotMangas($: CheerioAPI) {
        return this.getBlockTopMangas($, "#myDIV2")
    }

    async getNewUpdateMangas($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];

        $('ul.page-item > li.item').each((_: any, manga: any) => {
            const title = $('h2', manga).attr('title') || "";
            const id = $('a', manga).attr('href')?.split('/').pop() || "";
            const cover = $('img', manga).attr("data-srcset") || $('img', manga).attr("src") || "";
            const info = $('a', manga).find('b').text().trim();
            if (id) {
                items.push({id, title, subtitle: info, info: [info], cover});
            }
        });

        return items;
    }

    getNewUploadMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];

        $('ul.page-random li').each((_: any, manga: any) => {
            const title = $(manga).find('h2.des-same a b')?.text().trim() || "";
            const id = $(manga).find('h2.des-same a').attr('href')?.slice(1) || '';
            const cover = $(manga).find('div.img-same div').css("background")?.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || ''
            let info = ""
            info += $(manga).find('b a')?.text();
            info += "\n" + $(manga).find('b').eq(2).text() + $(manga).contents().eq(-1).text().trim()
            items.push({id, title, info: [info], cover});
        });

        return items;
    }

    getSuggestionMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];

        $('ul.page-random li').each((_: any, manga: any) => {
            const title = $(manga).find('h2.des-same a b')?.text().trim() || '';
            const id = $(manga).find('h2.des-same a').attr('href')?.slice(1) || '';
            const cover = $(manga).find('div.img-same div').css("background")?.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || ''
            items.push({id, title, cover});
        });

        return items;
    }

    async getMangasWithLikes($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];
        const excludeCategories = await GlobalStore.getExcludeCategories()

        $('div.block-item li').each((_: any, manga: any) => {
            const title = $(manga).find('div.box-description p a')?.eq(0).text().trim() || '';
            const id = $(manga).find('div a').attr('href')?.slice(1) || '';
            const cover = $(manga).find('div a img').attr('data-src') || '';
            const categories = $(manga)
                .find("p span a")
                .toArray()
                .map((element: Element) => {
                    return element.attribs['href'] || "";
                });
            const likes = $(manga).find('div.box-description p:nth-child(3)').text().trim()

            const containsExcludedCategory = categories.some(cat => (excludeCategories).includes(cat));
            if (id && !containsExcludedCategory) {
                items.push({id, title, subtitle: likes, info: [likes], cover});
            }
        });

        return items;
    }

    getMostLikedMangaDaily($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('#page-view-top li').each((_: any, manga: any) => {
            const id = $(manga).find('div a').attr('href')?.slice(1) || '';
            let title = $(manga).find('div a').text() || '';
            const likes = $(manga).find('div.view-top-2').text() || ''
            title = `${title} [${likes}]`
            const cover = '';
            if (id) {
                items.push({id, title, cover})
            }
        });

        return items;
    }

    async getRecommendMangas($: CheerioAPI): Promise<Highlight[]> {
        const items = await this.getMangasWithLikes($)
        return items.map((item) => {
            return {id: item.id, title: item.title, cover: item.cover, info: item.info}
        })
    }


    async getHomepageSection($: CheerioAPI, id: string): Promise<Highlight[]> {
        switch (id) {
            case "trending":
                return this.getTrendingMangas($)
            case "hot":
                return this.getHotMangas($)
            case "new_update":
                return this.getNewUpdateMangas($)
            case "new_upload":
                return this.getNewUploadMangas($)
            case "random_suggestion":
                return this.getSuggestionMangas($)
            case "top_liked_daily":
                return this.getMostLikedMangaDaily($)
            case "top_liked_all":
                return await this.getMangasWithLikes($)
            case "recommend":
                return await this.getRecommendMangas($)

            default:
                return []
        }
    }

    async getSearchResults($: CheerioAPI): Promise<Highlight[]> {
        const items: Highlight[] = [];

        for (const obj of $('li.search-li').toArray()) {
            const cover: string = $('img', obj).attr('src') ?? '';
            const title: string = $('b', $('div.search-des', obj)).text().trim() ?? '';
            const id = $('a', $('div.search-des', obj)).attr('href')?.split('/').pop() ?? '';

            if (!id || !title) continue;

            items.push({id, title, cover});
        }
        return items;
    }

    getRelatedMangas($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.page-same li').each((_: any, manga: any) => {
            const title = $(manga).find('div.des-same').text().trim()
            const id = $(manga).find('div.des-same a').attr('href')?.slice(1)
            const subtitle = $(manga).find('b').eq(1).text()
            const cover = $(manga).find('div.img-same div').css("background")?.replace(/^url\(["']?/, '').replace(/["']?\)$/, '') || ''
            if (id) {
                items.push({id, title, subtitle, cover})
            }
        })
        return items
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {

        const title = $("h1[itemprop='name'] a").text().replace(/\n/g, '');
        const cover = $("div.page-ava img[rel='image_src']").attr('src') || "";
        const summary = $("p:contains('Nội dung')").next().text();

        const genres = $('a', $('span:contains("Thể Loại:")').parent()).toArray();
        const translators = $('a', $('span:contains("Nhóm dịch:")').parent()).toArray();
        const authors = $('a', $('span:contains("Tác giả:")').parent()).toArray();
        const characters = $('a', $('span:contains("Nhân vật:")').parent()).toArray();
        const parodies = $('a', $('span:contains("Doujinshi:")').parent()).toArray();


        const genreTags = this.createTags($, genres)
        let recommendedPanelMode = ReadingMode.PAGED_MANGA;
        genreTags.forEach((genre) => {
            if (VERTICAL_TYPES.includes(genre.title)) {
                recommendedPanelMode = ReadingMode.WEBTOON;
            }
            if (COMIC_TYPES.includes(genre.title)) {
                recommendedPanelMode = ReadingMode.PAGED_COMIC;
            }
        })
        const isNSFW = true;


        const statusText = $("span:contains('Tình Trạng:')").next().text().trim(); // Get the text next to 'Tình Trạng:'
        let status = PublicationStatus.ONGOING; // Set default status
        if (statusText.includes("Đang tiến hành")) {
            status = PublicationStatus.ONGOING;
        } else if (statusText.includes("Đã hoàn thành")) {
            status = PublicationStatus.COMPLETED;
        }

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
                id: "genres",
                title: "Thể loại",
                tags: genreTags,
            });
        }
        if (translators.length > 0) {
            properties.push({
                id: "translators",
                title: "Nhóm dịch",
                tags: this.createTags($, translators),
            });
        }
        if (authors.length > 0) {
            properties.push({
                id: "authors",
                title: "Tác giả",
                tags: this.createTags($, authors),
            });
        }
        if (characters.length > 0) {
            properties.push({
                id: "characters",
                title: "Nhân vật",
                tags: this.createTags($, characters),
            });
        }
        if (parodies.length > 0) {
            properties.push({
                id: "doujinshi",
                title: "Doujinshi",
                tags: this.createTags($, parodies),
            });
        }

        const info: string[] = []
        const viewText = $('span.info:contains("Lượt xem:")').parent().text();
        const views = viewText.substring(viewText.indexOf('L')).split('\n')[0]?.slice(9).trim()
        if (views) {
            info.push(`👁 ${views}`)
        }
        const pageLikeElement = $('div.page_like')
        const likes = pageLikeElement.find('div.but_like').text().trim()
        const unlikes = pageLikeElement.find('div.but_unlike').text().trim()
        info.push(`👍 ${likes}  😡 ${unlikes}`)

        // Related Content
        const collections: HighlightCollection[] = [];
        const relatedMangas = this.getRelatedMangas($);

        if (relatedMangas.length > 0) {
            collections.push({
                id: "related_manga",
                title: "Cùng tác giả",
                highlights: relatedMangas,
            });
        }

        const chapters = await this.getChapters($)


        return {
            title,
            cover,
            status,
            summary,
            recommendedPanelMode,
            isNSFW,
            webUrl,
            chapters,
            properties,
            info,
            collections
        };
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
        $('table.listing tbody tr').each((index: number, element: Element) => {
            const chapterId = $('a', element).attr('href')?.slice(1) || "";
            const title = $('a h2', element).text();
            const time = $('td:last-child', element).text().trim();
            const [day, month, year] = time.split("/").map(Number);
            const date = new Date(year || 0, (month || 0) - 1, day);
            const number = index
            chapters.push({
                chapterId,
                title,
                date,
                number,
                index,
                language: "vi-vn",
                providers
            });
        });

        let total = chapters.length
        chapters.map((chapter) => {
            chapter.number = total;
            total -= 1;
        })

        return chapters;
    }


    getCategories($: CheerioAPI): Option[] {
        const tags: Option[] = []
        $("li").each((_: any, tag: any) => {
            const id = $(tag).find('a')?.attr('href') || ""
            const title = $(tag).find('a')?.text()
            tags.push({id, title})
        })
        return tags
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters = DEFAULT_FILTERS;
        const categories: Option[] = []
        $("ul.ul-search li").each((_: any, cat: any) => {
            const id = $(cat).find('input').attr('value') || ""
            const title = $(cat).text()
            categories.push({id, title})
        })
        filters.push({id: "categories", title: "Thể loại cần tìm", options: categories, type: FilterType.MULTISELECT})
        return filters
    }


    async getChapterData($: CheerioAPI): Promise<ChapterData> {
        const urls: string[] = [];

        const imageServerDomain = await GlobalStore.getImageServer()
        $('#image img').each((_: any, obj: any) => {
            if (!obj.attribs['data-src']) return;
            let link = obj.attribs['data-src'];
            if (imageServerDomain.includes(REPLACEABLE_IMAGE_SERVER_DOMAIN)) {
                const resourceID = link.substring(link.indexOf("20"))
                link = `https://${imageServerDomain}/images/${resourceID}`
            }
            urls.push(link);
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
                    title: $(element).text().trim().replace(/(\d+\s*)+$/, ''),
                    id: $(element).attr('href') || "",
                });
        }
        return tags
    }

    isLastPage = ($: CheerioAPI): boolean => {
        const nextButton = $('.pagination').find('a').last();

        // Check if the text of the button contains 'Next' or 'Cuối'
        return !(nextButton.text().includes('Next') || nextButton.text().includes('Cuối'));
    }
}
