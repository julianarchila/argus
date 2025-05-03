import { ELTIEMPO_FEED_URL, FeedItem, FeedParser } from "./types";
import { cherrioFromUrl } from "./utils";


export const elTiempoFeedParser: FeedParser = async () => {
  const $ = await cherrioFromUrl(ELTIEMPO_FEED_URL);
  return _elTiempoCherrioParse($);
}


// internal function so writing tests is easier
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

