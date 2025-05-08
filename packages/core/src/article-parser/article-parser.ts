import { cherrioFromUrl } from "../utils";
import { Article } from "./types";


export const makeArticleParser = (callback: ($: cheerio.Root) => Omit<Article, "url">) => {
  return async (url: string) => {
    const $ = await cherrioFromUrl({
      url,
    });

    const article = callback($)
    return {
      ...article,
      url
    }
  }
}
