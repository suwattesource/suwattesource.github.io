import {CheerioAPI} from "cheerio";
import {Highlight} from "@suwatte/daisuke";

export interface SearchConfig {
    url: string;
    func?: ($: CheerioAPI) => Highlight[];
}