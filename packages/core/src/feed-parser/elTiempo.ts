import { ELTIEMPO_FEED_URL, FeedItem, FeedParser } from "./types";
import { cherrioFromUrl } from "../utils";

/**
 * Feed parser for El Tiempo news source
 * Fetches and parses the XML feed from El Tiempo's sitemap
 */
export const elTiempoFeedParser: FeedParser = async () => {
  const $ = await cherrioFromUrl({
    url: ELTIEMPO_FEED_URL,
    xml: true
  });
  return _elTiempoCherrioParse($);
}

/**
 * Parses El Tiempo XML feed content using Cheerio
 * @param {cheerio.Root} $ - Cheerio instance loaded with XML content
 * @internal - Used internally to facilitate testing
 */
async function _elTiempoCherrioParse($: cheerio.Root): Promise<FeedItem[]> {
  const items: FeedItem[] = [];
  $('url').each((_, el) => {
    const urlElem = $(el);
    const loc = urlElem.find('loc').text();
    const lastmod = urlElem.find('lastmod').text();
    const newsTitle = urlElem.find('news\\:title').text();
    const pubDate = urlElem.find('news\\:publication_date').text();
    const keywords = urlElem.find('news\\:keywords').text();

    items.push({
      url: loc,
      lastModified: new Date(lastmod),
      title: newsTitle,
      publicationDate: new Date(pubDate),
      keywords: keywords,
    });
  });
  return items;
}

