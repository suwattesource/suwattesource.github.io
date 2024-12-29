import {
    Chapter,
    ChapterData,
    Content,
    DirectoryFilter,
    FilterType,
    Highlight,
    Option,
    Property,
    PublicationStatus,
    ReadingMode,
    Tag
} from "@suwatte/daisuke";
import {CheerioAPI, Element} from "cheerio";
import {DEFAULT_FILTERS} from "./constants";

export class Parser {

    getSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.page-listing-item').each((index: number, pageListingItem: any) => {
            $(pageListingItem).find('div.col-6.col-md-2.badge-pos-1').each((index: number, element: any) => {
                const linkElement = $(element).find('div.item-thumb > a').first();
                const id = linkElement.attr('href') || "";
                const title = linkElement.attr('title')?.trim() || "";
                const cover = $(element).find('a>img').attr('data-src') || ""; // Changed to data-src
                items.push({id, title, cover});
            });
        });
        return items;
    }

    getAdvancedSearchResults($: CheerioAPI): Highlight[] {
        const items: Highlight[] = [];
        $('div.c-tabs-item__content').each((index: number, element: any) => {
            const linkElement = $(element).find('div.tab-thumb a').first();
            const id = linkElement.attr('href') || "";
            const title = linkElement.attr('title')?.trim() || "";
            const cover = $(element).find('div.tab-thumb img').attr('data-src') || "";
            items.push({id, title, cover});
        });
        return items;
    }

    async getContent($: CheerioAPI, webUrl: string): Promise<Content> {
        // Extract the main title
        const title = $(".post-title h1").text().trim();

        // Additional Titles (currently not available in the HTML, kept for compatibility)
        const altTitle = $('p.subtitle').text().trim();
        const additionalTitles: string[] = altTitle ? [altTitle] : [];

        // Genres
        const genres = $('.genres-content a').toArray();

        // Artists
        const artists = $('.artist-content a').toArray();

        // Status
        const statusText = $(".summary-heading:contains(Status)").next(".summary-content").text().trim();
        const status = statusText === "Completed" ? PublicationStatus.COMPLETED : PublicationStatus.ONGOING;

        // Rank (e.g., "2nd, it has 724.7K monthly views")
        const rankText = $(".summary-heading:contains(Rank)").next(".summary-content").text().trim();
        const [rank, totalViews] = rankText.split(", it has ").map(s => s.trim());

        // Cover image
        const coverElement = $('.summary_image img');
        const cover = coverElement.attr('data-src') || coverElement.attr('src') || "";

        // Average rating and total votes
        const averageRating = parseFloat($('#averagerate').text().trim()) || 0;
        const ratingCount = $("#countrate").text().trim();

        // Comments and bookmarks
        const comments = parseInt($(".count-comment .action_detail span").text().replace(/[^\d]/g, "")) || 0;
        const bookmarks = parseInt($(".add-bookmark .action_detail span").text().replace(/[^\d]/g, "")) || 0;

        // Extract genres as tags
        const genreTags = this.createTags($, genres);

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
                title: "Genres",
                tags: genreTags,
            });
        }

        if (artists.length > 0) {
            properties.push({
                id: "artists",
                title: "Artists",
                tags: this.createTags($, artists),
            });
        }

        const chapters = this.getChapters($)

        // Info section
        const info = [
            `⭐ Average Rating: ${averageRating} / 5`,
            `👥 Votes: ${ratingCount}`,
            `📊 Rank: ${rank}`,
            `📖 Monthly Views: ${totalViews}`,
            `💬 Comments: ${comments}`,
            `🔖 Bookmarks: ${bookmarks}`,
        ];

        // Return the structured content
        return {
            title,
            additionalTitles,
            cover,
            status,
            recommendedPanelMode: ReadingMode.PAGED_COMIC, // Default value; adjust if necessary
            isNSFW: true,
            webUrl,
            properties,
            info,
            chapters,
        };
    }

    getChapters($: CheerioAPI): Chapter[] {
        const chapters: Chapter[] = [];
        let index = 0;

        $('ul.main.version-chap.no-volumn > li.wp-manga-chapter').each((_, element) => {
            const chapterLink = $(element).find('a');
            const chapterId = chapterLink.attr('href') || "";
            const title = chapterLink.text().trim();
            const number = Number(title.split(' ')[0]) || index + 1; // Fallback to index if parsing fails
            const time = $(element).find('span.chapter-release-date a').attr('title') || "";

            chapters.push({
                chapterId,
                number,
                title,
                index,
                language: "en-us", // Assuming English as language
                date: time ? new Date(time) : new Date(), // Fallback to current date
            });
            index++;
        });

        return chapters;
    }

    getChapterData($: CheerioAPI): ChapterData {
        const urls: string[] = [];
        $('div.page-break img').each((_, element) => {
            const url = $(element).attr('data-src') || $(element).attr('src') || "";
            if (url) {
                urls.push(url.trim());
            }
        });

        return {
            pages: urls.map((url) => ({url})),
        };
    }

    createTags($: CheerioAPI, elements: Element[]): Tag[] {
        const tags: Tag[] = [];
        for (const element of elements) {
            tags.push({
                title: $(element).text().trim(),
                id: $(element).attr('href') || "",
            });
        }
        return tags;
    }

    getFilters($: CheerioAPI): DirectoryFilter[] {
        const filters: DirectoryFilter[] = DEFAULT_FILTERS;
        const genres: Option[] = [];
        $('[class="Arial, Helvetica, sans-serif"] > a').each((_, element) => {
            const id = $(element).attr('href') || "";
            const title = $(element).text().trim();
            genres.push({id, title});
        });

        filters.push({
            id: "genres",
            title: "Genres",
            options: genres,
            type: FilterType.MULTISELECT
        })
        return filters;
    }
}