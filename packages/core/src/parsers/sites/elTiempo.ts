import { createArticleParser, createFeedParser } from "../parser-utils";
import { FeedItem, SiteConfig } from "../types";
import TurndownService from "turndown";

// Constants
const SITE_NAME = "elTiempo";
const FEED_URL = "https://www.eltiempo.com/sitemap-google-news.xml";

/**
 * Parse El Tiempo XML feed content using Cheerio
 */
const parseFeed = ($: cheerio.Root): FeedItem[] => {
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
};

/**
 * Parse El Tiempo date in their specific format
 */
const parseEltiempoDate = (dateText: string) => {
  if (!dateText) return null;
  
  const parts = dateText.split(' ');
  if (parts.length !== 2) return null;
  
  const dateComponents = parts[0].split('.');
  const timeComponents = parts[1].split(':');
  
  if (dateComponents.length !== 3 || timeComponents.length !== 2) return null;
  
  const day = Number(dateComponents[0]);
  const month = Number(dateComponents[1]);
  const year = Number(dateComponents[2]);
  const hours = Number(timeComponents[0]);
  const minutes = Number(timeComponents[1]);
  
  // Validate that all components are valid numbers
  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
    return null;
  }
  
  // Create date in local time
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Convert from Bogota timezone (UTC-5) to UTC
  // Add 5 hours to convert from Bogota to UTC
  const utcDate = new Date(localDate.getTime() + 5 * 60 * 60 * 1000);
  
  return utcDate;
};

/**
 * Extract article content from El Tiempo page
 */
const parseArticle = ($: cheerio.Root) => {
  let author = $(".c-articulo__autor__nombre").text();

  let dateText = $(".c-articulo__autor__fecha").find("time").first().text();
  let date = parseEltiempoDate(dateText);

  const contentDiv = $('div.c-cuerpo');
  let articleText = '';
  let articleMarkdown = '';
  const turndownService = new TurndownService();

  contentDiv.find('div.paragraph').each((_, elem) => {
    const paragraph = $(elem);
    articleText += paragraph.text() + '\n';
    articleMarkdown += turndownService.turndown(paragraph.html() || "") + '\n';
  });

  return {
    text: articleText.trim(),
    markdown: articleMarkdown.trim(),
    author: author || null,
    date
  };
};

// Create feed and article parsers
const feedParser = createFeedParser(SITE_NAME, FEED_URL, parseFeed);
const articleParser = createArticleParser(SITE_NAME, parseArticle);

// Export site configuration
export const elTiempoConfig: SiteConfig = {
  siteName: SITE_NAME,
  feedParser,
  articleParser
}; 