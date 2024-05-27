import {Target} from "../runners/nhentai";
import emulate from "@suwatte/emulator";
import {PublicationStatus, ReadingMode} from "@suwatte/daisuke";
import {ChapterDataSchema, ChapterSchema, ContentSchema, PagedResultSchema,} from "@suwatte/validate";

describe("NHentai Tests", () => {
    const source = emulate(Target);

    test("Query", async () => {
        const data = await source.getSectionsForPage({id: ""})
        expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object));
    });

    test("Profile", async () => {
        const content = await source.getContent("501113");
        expect(ContentSchema.parse(content)).toEqual(expect.any(Object));
        expect(content.title).toBe("Shexyo");
        expect(content.recommendedPanelMode).toBe(ReadingMode.PAGED_COMIC);
        expect(content.status).toBe(PublicationStatus.COMPLETED);
        expect(content.properties?.[0]).toBeDefined();
        expect(content.creators?.includes("Mini")).toBe(true);
    });

    test("Chapters", async () => {
        const chapters = await source.getChapters("72315");
        expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array));
        expect(chapters.length).toBeGreaterThan(1);
    });

    test("Reader", async () => {
        const data = await source.getChapterData("84565", "2176683");
        expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object));
    });
});
