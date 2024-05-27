import {Target} from "../runners/cmanga";
import emulate from "@suwatte/emulator";
import {DirectoryRequest} from "@suwatte/daisuke";
import {ChapterDataSchema, ChapterSchema, ContentSchema, PagedResultSchema} from "@suwatte/validate";

describe("CManga Tests", () => {
    const source = emulate(Target);


    test("Homepage", async (): Promise<void> => {
        const sections = await source.getSectionsForPage({id: "home"})
        console.log(sections)
    });

    test("Query", async () => {
        const filters: DirectoryRequest = {
            tag: {
                tagId: "/theloai/comedy",
                propertyId: "genres"
            },
            page: 1
        }
        const data = await source.getDirectory(filters)
        expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object));
    });

    test("Profile", async () => {
        const content = await source.getContent("sieu-than-che-tap-su-23220");
        expect(ContentSchema.parse(content)).toEqual(expect.any(Object));
    });

    test("Chapters", async () => {
        const chapters = await source.getChapters("72315");
        expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array));
        expect(chapters.length).toBeGreaterThan(1);
    });

    test("Reader", async () => {
        const data = await source.getChapterData("-", "836985");
        expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object));
    });
    test("Tag", async () => {
        const data = await source.getTags();
        expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object));
    });

});
