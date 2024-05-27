import {Target} from "../runners/truyenqq";
import emulate from "@suwatte/emulator";
import {DirectoryRequest} from "@suwatte/daisuke";
import {ChapterDataSchema, ChapterSchema, ContentSchema, PagedResultSchema} from "@suwatte/validate";

describe("Truyen QQ Tests", () => {
    const source = emulate(Target);

    test("Homepage", async (): Promise<void> => {
        const sections = await source.getSectionsForPage({id: "home"})
        console.log(sections)
    });

    test("Query", async () => {
        const filters: DirectoryRequest = {
            tag: {
                tagId: "/nhom-dich/someya-2659",
                propertyId: "translator"
            },
            page: 1
        }
        const data = await source.getDirectory(filters)
        expect(PagedResultSchema.parse(data)).toEqual(expect.any(Object));
    });

    test("Profile", async () => {
        const content = await source.getContent("/26564/gannibal");
        expect(ContentSchema.parse(content)).toEqual(expect.any(Object));
    });

    test("Chapters", async () => {
        const chapters = await source.getChapters("72315");
        expect(ChapterSchema.array().parse(chapters)).toEqual(expect.any(Array));
        expect(chapters.length).toBeGreaterThan(1);
    });

    test("Reader", async () => {
        const data = await source.getChapterData("84565", "/c870723/roi-anh-se-phai-muon-yeu-em-chuong-17-lam-loi-qua");
        expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object));
    });

    test("Auth", async () => {
        const data = await source.handleBasicAuth("nt.nha1809@gmail.com", "Thanhnha123@");
        expect(ChapterDataSchema.parse(data)).toEqual(expect.any(Object));
    });
});
