import * as cheerio from "cheerio";
import { Article, ArticleParser, FeedItem, FeedParser } from "./types";

/**
 * Fetches HTML or XML content from a URL and loads it into a Cheerio parser instance
 */
export async function cherrioFromUrl({
  url,
  xml = false
}: {
  url: string;
  xml?: boolean;
}): Promise<cheerio.Root> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const document = await response.text();

  if (xml) {
    return cheerio.load(document, { xmlMode: true });
  }
  return cheerio.load(document);
}

/**
 * Creates a feed parser with the given site name and parsing function
 */
export function createFeedParser(
  siteName: string,
  feedUrl: string,
  parseFunction: (root: cheerio.Root) => Promise<FeedItem[]> | FeedItem[]
): FeedParser {
  return {
    parse: async () => {
      const $ = await cherrioFromUrl({ url: feedUrl, xml: true });
      return parseFunction($);
    }
  };
}

/**
 * Creates an article parser with the given site name and parsing function
 */
export function createArticleParser(
  siteName: string,
  parseFunction: (root: cheerio.Root, url: string) => Promise<Omit<Article, "url">> | Omit<Article, "url">
): ArticleParser {
  return {
    parse: async (url: string) => {
      const $ = await cherrioFromUrl({ url });
      const articleData = await parseFunction($, url);
      
      return {
        ...articleData,
        url
      };
    }
  };
}

/**
 * Filters feed items based on a last processed date
 */
export function filterItemsByDate(items: FeedItem[], lastProcessed?: Date | null): FeedItem[] {
  if (!lastProcessed) return items;

  return items.filter(item => item.publicationDate && item.publicationDate > lastProcessed);
}