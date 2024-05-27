import {Cookie, Highlight} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";

export interface SearchConfig {
    url: string;
    cookies?: Cookie[];
    func: ($: CheerioAPI) => Promise<Highlight[]>;
}
