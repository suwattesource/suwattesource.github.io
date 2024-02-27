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
  PublicationStatus,
} from "@suwatte/daisuke";
import { CheerioAPI, load, Element, Cheerio } from "cheerio";

import {
  IMHENTAI_DOMAIN,
} from "./constants";

import {
  decodeHTMLEntity,
} from "./utils"

export class Parser {
  THUMBNAIL_TEMPLATE = "";


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

    // sort
    filters.push({
      id: "sort",
      title: "Sắp xếp theo",
      type: FilterType.SELECT,
      options: sortTags.map((v) => ({
        id: v.id,
        title: v.title,
      })),
    });

    return filters;
  }

  parseSearch(html: string): Highlight[] {
    const $ = load(html)
    const items: Highlight[] = [];

    for (const obj of $('div.thumb', 'div.row.galleries').toArray()) {
      const cover: string = this.getImageSrc($('img', $('div.inner_thumb', obj)).first() ?? '')
      const title: string = $('h2, div.caption', obj).first().text().trim() ?? ''
      const subtitle: string = $('a.thumb_cat', obj).text().trim() ?? ''
      const id = $('h2 > a, div.caption > a', obj).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? ''

      items.push({ id, title, subtitle, cover });
    }
    return items;
  }

  content(html: string, id: string): Content {
    const $ = load(html);

    const title = $("h1").text()
    const tags = $('a', $('span:contains(Tags)').parent()).toArray();
    const parodies = $('a', $('span:contains(Parodies)').parent()).toArray();
    const artists = $('a', $('span:contains(Artists)').parent()).toArray();
    const characters = $('a', $('span:contains(Characters)').parent()).toArray();
    const groups = $('a', $('span:contains(Groups)').parent()).toArray();
    const languages = $('a', $('span:contains(Languages)').parent()).toArray();
    const category = $('a', $('span:contains(Category)').parent()).toArray();


    const summary = $('li.pages').text().replace('Pages: ', '');
    const status = PublicationStatus.ONGOING


    let recommendedPanelMode = ReadingMode.PAGED_COMIC;


    const properties: Property[] = [];
    if (tags.length > 0) {
      properties.push({
        id: "genres",
        title: "Genres",
        tags: this.createTags($, tags),
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
    if (category.length > 0) {
      properties.push({
        id: "category",
        title: "Category",
        tags: this.createTags($, category),
      });
    }


    const cover = this.getImageSrc($('img.lazy, div.cover > img').first())

    const isNSFW = true;
    const chapters = this.chapters(html)
    const webUrl = `${IMHENTAI_DOMAIN}/gallery/${id}`

    return { title, cover, status, summary, recommendedPanelMode, isNSFW, webUrl, chapters, properties };
  }

  chapters(html: string): Chapter[] {
    const chapters: Chapter[] = [];

    const $ = load(html)
    const languageTag = $('a', $('span:contains(Language)').parent()).first().text().trim()
    let language = '🇬🇧'
    if (languageTag.includes('japanese')) {
      language = '🇯🇵'
    } else if (languageTag.includes('spanish')) {
      language = '🇪🇸'
    } else if (languageTag.includes('french')) {
      language = '🇫🇷'
    } else if (languageTag.includes('korean')) {
      language = '🇰🇷'
    } else if (languageTag.includes('german')) {
      language = '🇩🇪'
    } else if (languageTag.includes('russian')) {
      language = '🇷🇺'
    }

    const timeElement = $('li.posted').text();

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


  chapterData(html: string): ChapterData {
    const $ = load(html)
    const pages: string[] = []

    const pageCount = Number($('#load_pages').attr('value'))
    const imgDir = $('#load_dir').attr('value')
    const imgId = $('#load_id').attr('value')

    const domain = this.getImageSrc($('img.lazy, div.cover > img').first())
    const subdomainRegex = domain.match(/\/\/([^.]+)/)

    let subdomain = null
    if (subdomainRegex && subdomainRegex[1]) subdomain = subdomainRegex[1]

    const domainSplit = IMHENTAI_DOMAIN.split('//')

    for (let i = 0; i < pageCount; i++) {
      pages.push(`${domainSplit[0]}//${subdomain}.${domainSplit[1]}/${imgDir}/${imgId}/${i + 1}.jpg`)
    }

    return {
      pages: pages.map((url) => ({ url })),
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
    for (const element in elements) {
      tags.push(
        {
          title: $(element).text().trim().replace(/(\d+\s*)+$/, ''),
          id: $(element).attr('href') || "",
        });
    }
    return tags
  }

  getImageSrc = (imageObj: Cheerio<Element> | undefined): string => {
    let image
    if (typeof imageObj?.attr('data-original') != 'undefined') {
      image = imageObj?.attr('data-original')
    }
    if (typeof imageObj?.attr('data-cfsrc') != 'undefined') {
      image = imageObj?.attr('data-cfsrc')
    }
    else if (typeof imageObj?.attr('data-src') != 'undefined') {
      image = imageObj?.attr('data-src')
    }
    else if (typeof imageObj?.attr('data-bg') != 'undefined') {
      image = imageObj?.attr('data-bg')
    }
    else if (typeof imageObj?.attr('data-srcset') != 'undefined') {
      image = imageObj?.attr('data-srcset')
    }
    else if (typeof imageObj?.attr('data-lazy-src') != 'undefined') {
      image = imageObj?.attr('data-lazy-src')
    }
    else if (typeof imageObj?.attr('data-aload') != 'undefined') {
      image = imageObj?.attr('data-aload')
    }
    else if (typeof imageObj?.attr('srcset') != 'undefined') {
      image = imageObj?.attr('srcset')?.split(' ')[0] ?? ''
    }
    else {
      image = imageObj?.attr('src')
    }
    return encodeURI(decodeURI(decodeHTMLEntity(image?.trim() ?? '')))
  }

}

export const isLastPage = (html: string): boolean => {
  const $ = load(html)
  let isLast = false
  const hasEnded = $('li.page-item', 'ul.pagination').last().attr('class')
  if (hasEnded === 'page-item disabled') isLast = true
  return isLast;
}