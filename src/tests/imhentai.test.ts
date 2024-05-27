import {Target} from "../runners/imhentai";
import emulate from "@suwatte/emulator";
import {PublicationStatus, ReadingMode} from "@suwatte/daisuke";
import {ChapterDataSchema, ChapterSchema, ContentSchema,} from "@suwatte/validate";

describe("IMHentai Tests", () => {
    const source = emulate(Target);


    test("Profile", async () => {
        const content = await source.getContent("1252923");
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
