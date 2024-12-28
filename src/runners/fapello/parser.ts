import {Chapter, ChapterData, Content, Highlight} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";
import {GlobalStore} from "./store";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];

        $('div.grid > div').each((_index, element) => {
            const idElement = $(element).find('a[href]').attr('href');
            const cover = $(element).find('img').eq(1).attr('src') || "";
            const title = $(element).find('div > a[href]').last().text().trim();

            if (idElement && cover && title) {
                // Extract the mangaId from the href attribute
                const id = idElement.match(/\/\/[^/]+\/([^/]+)\//)?.[1] || "";

                // Push the extracted data to the items array
                items.push(
                    {
                        id: id,
                        cover: cover,
                        title: title,
                    },
                )
            }
        });

        return items

    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        const title = $('h2.font-semibold').text().trim();
        const cover = $('div.bg-gradient-to-tr a img').attr('src') || "";
        // const mediaAndLikes = $('div.divide-gray-300.divide-transparent.divide-x.grid.grid-cols-2.lg\\:text-left.lg\\:text-lg.mt-3.text-center.w-full.dark\\:text-gray-100').text().trim();

        // const [_, _] = mediaAndLikes.split(/\s+/);
        const chapters = await this.getChapters($)
        return {
            title,
            cover,
            webUrl,
            chapters,
        };
    }

    async getChapters($: CheerioAPI): Promise<Chapter[]> {
        const chapters: Chapter[] = [];
        const mediaAndLikes = $('div.divide-gray-300.divide-transparent.divide-x.grid.grid-cols-2.lg\\:text-left.lg\\:text-lg.mt-3.text-center.w-full.dark\\:text-gray-100').text().trim();
        const [images, _] = mediaAndLikes.split(/\s+/);

        const numberOfImages = await GlobalStore.getNumImages()
        if (numberOfImages == 0) {
            chapters.push({
                chapterId: "chapter",
                number: 1,
                title: "Images",
                index: 1,
                language: 'en-us',
                date: new Date(),
            });
            return chapters;
        }

        const numberOfChapters = Math.ceil(Number(images) / numberOfImages);
        for (let i = numberOfChapters; i >= 1; i--) {
            chapters.push({
                chapterId: i.toString(),
                number: i,
                title: `Image ${(i - 1) * numberOfImages + 1} - ${Math.min(i * numberOfImages, Number(images))}`,
                index: numberOfChapters - i,
                language: 'en-us',
                date: new Date(),
            });
        }
        return chapters;
    }


    getChapterData($: CheerioAPI, contentId: string): ChapterData {
        const pages: string[] = []
        const avatarImgURL = $('div.bg-gradient-to-tr a img').attr('src') || "";
        const baseImgURL = avatarImgURL.match(/^(.+?)\/\d+\/.+$/)?.[1];
        const mediaAndLikes = $('div.divide-gray-300.divide-transparent.divide-x.grid.grid-cols-2.lg\\:text-left.lg\\:text-lg.mt-3.text-center.w-full.dark\\:text-gray-100').text().trim();

        const lastImageSrc = $('#content img').first().attr('src') || "";
        const lastImageIndex = parseInt(lastImageSrc.match(/(\d+)(?=_[^_]*\.jpg$)/)?.[1] || '', 10);

        const [images, _] = mediaAndLikes.split(/\s+/);

        for (let i = 0; i <= Number(images); i++) {
            pages.push(`${baseImgURL}/${(Math.floor((lastImageIndex - i) / 1000) + 1) * 1000}/${contentId}_${String(lastImageIndex - i).padStart(4, '0')}.jpg`)
        }

        return {
            pages: pages.map((url) => ({url})),
        };
    }
}