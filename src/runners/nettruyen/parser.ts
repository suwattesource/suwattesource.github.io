import {
  Highlight,
  Content,
  Property,
  ReadingMode,
  Tag,
  Chapter,
  ChapterData,
  FilterType,
  DirectoryFilter,
} from "@suwatte/daisuke";
import { CheerioAPI, load } from "cheerio";

import {
  ADULT_TAGS,
  VERTICAL_TYPES,
  STATUS_KEYS,
  NETTRUYEN_DOMAIN,
} from "./constants";


export class Parser {
  THUMBNAIL_TEMPLATE = "";

  getTrendingMangas = ($: CheerioAPI): Highlight[] => {
    const items: Highlight[] = [];

    $('div.item', 'div.altcontent1').each((_: any, manga: any) => {
      const title = $('.slide-caption > h3 > a', manga).text();
      const id = $('a', manga).attr('href')?.split('/').pop() || "";
      const cover = ($('a > img.lazyOwl', manga).attr('data-src') || "").replace(/^\/\//, "https://");
      items.push({ id, title, cover });
    });

    return items;
  }

  getLatestMangas = ($: CheerioAPI): Highlight[] => {
    const items: Highlight[] = [];

    $('div.item', 'div.row').each((_: any, manga: any) => {
      const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
      const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop() || "";
      let cover = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
      cover = !cover ? "https://i.imgur.com/GYUxEX8.png" : 'https:' + cover
      const updateTime = $('figcaption > ul.comic-item > li.chapter:first-child > i.time', manga).text().trim();

      items.push({ id, title, cover, info: [updateTime] });
    });

    return items;
  }


  homepageSection(id: string, $: CheerioAPI): Highlight[] {
    const highlights: Highlight[] = []
    switch (id) {
      case "trending":
        return this.getTrendingMangas($)
      case "latest":
        return this.getLatestMangas($)
      default:
    }
    return highlights;
  }

  filters(html: string): DirectoryFilter[] {
    const $ = load(html)
    const filters: DirectoryFilter[] = [];


    const genreTags: Tag[] = [];
    const numChapTags: Tag[] = [];
    const statusTags: Tag[] = [];
    const genderTags: Tag[] = [];
    const sortTags: Tag[] = [];

    for (const tag of $('div.col-md-3.col-sm-4.col-xs-6.mrb10', 'div.col-sm-10 > div.row').toArray()) {
      const title = $('div.genre-item', tag).text().trim();
      const id = $('div.genre-item > span', tag).attr('data-id') ?? "";
      if (!id || !title) continue;
      genreTags.push({ id: id, title: title });
    }

    for (const tag of $('option', 'select.select-minchapter').toArray()) {
      const title = $(tag).text().trim();
      const id = $(tag).attr('value') ?? "";
      if (!id || !title) continue;
      numChapTags.push({ id: id, title: title });
    }

    for (const tag of $('option', '.select-status').toArray()) {
      const title = $(tag).text().trim();
      const id = $(tag).attr('value') ?? "";
      if (!id || !title) continue;
      statusTags.push({ id: id, title: title });
    }

    for (const tag of $('option', '.select-gender').toArray()) {
      const title = $(tag).text().trim();
      const id = $(tag).attr('value') ?? "";
      if (!id || !title) continue;
      genderTags.push({ id: id, title: title });
    }

    for (const tag of $('option', '.select-sort').toArray()) {
      const title = $(tag).text().trim();
      const id = $(tag).attr('value') ?? "";
      if (!id || !title) continue;
      sortTags.push({ id: id, title: title });
    }

    // genres
    filters.push({
      id: "genres",
      title: "Thể loại",
      type: FilterType.EXCLUDABLE_MULTISELECT,
      options: genreTags.map((v) => ({
        id: v.id,
        title: v.title,
      })),
    });

    // numChap
    filters.push({
      id: "numchap",
      title: "Số lượng chapter",
      type: FilterType.SELECT,
      options: numChapTags.map((v) => ({
        id: v.id,
        title: v.title,
      })),
    });

    // status
    filters.push({
      id: "status",
      title: "Tình trạng",
      type: FilterType.SELECT,
      options: statusTags.map((v) => ({
        id: v.id,
        title: v.title,
      })),
    });

    // gender
    filters.push({
      id: "gender",
      title: "Dành cho",
      type: FilterType.SELECT,
      options: genderTags.map((v) => ({
        id: v.id,
        title: v.title,
      })),
    });

    return filters;
  }

  parseSearch(html: string): Highlight[] {
    const $ = load(html)
    const items: Highlight[] = [];
    $('div.item', 'div.row').each((_: any, manga: any) => {
      const title = $('figure.clearfix > figcaption > h3 > a', manga).first().text();
      const id = $('figure.clearfix > div.image > a', manga).attr('href')?.split('/').pop() || "";
      let cover = $('figure.clearfix > div.image > a > img', manga).first().attr('data-original');
      cover = !cover ? "https://i.imgur.com/GYUxEX8.png" : 'https:' + cover
      const updateTime = $('figcaption > ul.comic-item > li.chapter:first-child > i.time', manga).text().trim();

      items.push({ id, title, cover, info: [updateTime] });
    });

    return items;
  }

  content(html: string, id: string): Content {
    const $ = load(html);

    const title = $('h1.title-detail').text().trim();
    const cover = 'https:' + $('div.col-image > img').attr('src');
    const summary = $('div.detail-content > p').text();
    const status = STATUS_KEYS[$('ul.list-info > li.status > p.col-xs-8').text()];

    const genres: Tag[] = [];
    $('li.kind > p.col-xs-8 > a').each((_: any, obj: any) => {
      const title = $(obj).text();
      const id = $(obj).attr('href')?.split('/')[4] ?? "";
      if (id) {
        genres.push({ id: id, title: title, nsfw: ADULT_TAGS.includes(title) });
      }
    });

    const authors: Tag[] = [];
    $('ul.list-info > li.author > p.col-xs-8 > a').each((_: any, obj: any) => {
      const title = $(obj).text();
      const id = $(obj).attr('href')?.split('?')[1] ?? "";;
      if (id) {
        authors.push({ id: id, title: title, nsfw: false });
      }
    });

    // Reading Mode
    let recommendedPanelMode = ReadingMode.PAGED_MANGA;
    genres.forEach((item) => {
      if (VERTICAL_TYPES.includes(item.title)) {
        recommendedPanelMode = ReadingMode.WEBTOON;
      }
    })

    const properties: Property[] = [];
    if (genres.length > 0) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: genres,
      });
    }
    if (authors.length > 0) {
      properties.push({
        id: "authors",
        title: "Authors",
        tags: authors,
      });
    }

    const isNSFW = genres.some((v) => v.nsfw);

    const chapters = this.chapters(html)
    const webUrl = `${NETTRUYEN_DOMAIN}/truyen-tranh/${id}`

    const followers = $('div.follow span').text().trim().split(' ')[1].split("\n")[1];
    const views = $('ul.list-info li.row:nth-child(5) p.col-xs-8').text().trim();
    const ratingCount = $('div.mrt5.mrb10 span[itemprop="aggregateRating"] span[itemprop="ratingCount"]').text().trim();
    const info = [
      views ? `👁️ Views: ${views}` : "",
      `📚 Follows: ${followers}`,
      `⭐️ Rating count: ${ratingCount}`,

    ].filter((v) => !!v);

    return { title, cover, status, summary, recommendedPanelMode, isNSFW, webUrl, chapters, properties, info };
  }

  chapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];

    const $ = load(html)
    let index = 0
    $('div.list-chapter > nav > ul > li.row:not(.heading)').each((_: any, obj: any) => {
      const chapterId = String($('div.chapter a', obj).attr('href')).split('/').slice(-3).join('/');;
      const time = $('div.col-xs-4', obj).text();
      let title = $('div.chapter a', obj).text();
      const number = parseFloat($('div.chapter a', obj).text().split(' ')[1] || "");
      const date = this.convertTime(time);

      chapters.push({
        chapterId,
        number,
        title,
        index,
        language: "vi",
        date: date,
      });
      index++;
    })
    return chapters;
  }


  chapterData(html: string): ChapterData {
    const $ = load(html)
    const urls: string[] = [];

    $('div.reading-detail > div.page-chapter > img').each((_: any, obj: any) => {
      if (!obj.attribs['data-original']) return;
      const link = obj.attribs['data-original'];
      urls.push(link.indexOf('https') === -1 ? 'https:' + link : link);
    });

    return {
      pages: urls.map((url) => ({ url })),
    };
  }

  convertTime = (timeAgo: string): Date => {
    let trimmed = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = (trimmed === 0 && timeAgo.includes('a')) ? 1 : trimmed;

    if (timeAgo.includes('giây') || timeAgo.includes('secs')) {
      return new Date(Date.now() - trimmed * 1000);
    } else if (timeAgo.includes('phút')) {
      return new Date(Date.now() - trimmed * 60000);
    } else if (timeAgo.includes('giờ')) {
      return new Date(Date.now() - trimmed * 3600000);
    } else if (timeAgo.includes('ngày')) {
      return new Date(Date.now() - trimmed * 86400000);
    } else if (timeAgo.includes('năm')) {
      return new Date(Date.now() - trimmed * 31556952000);
    } else if (timeAgo.includes(':')) {
      const [H, D] = timeAgo.split(' ');
      const fixD = String(D).split('/');
      const finalD = `${fixD[1]}/${fixD[0]}/${new Date().getFullYear()}`;
      return new Date(`${finalD} ${H}`);
    } else {
      const split = timeAgo.split('/');
      return new Date(`${split[1]}/${split[0]}/20${split[2]}`);
    }
  }
}