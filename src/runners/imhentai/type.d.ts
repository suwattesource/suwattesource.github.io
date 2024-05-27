import {Highlight} from "@suwatte/daisuke";
import {CheerioAPI} from "cheerio";

export interface SearchConfig {
    url: string;
    func: ($: CheerioAPI) => Promise<Highlight[]>;
}
