import { createArticleParser, createFeedParser } from "../parser-utils";
import { FeedItem, SiteConfig } from "../types";
import TurndownService from "turndown";


// Constants
const SITE_NAME = "elEspectador"
const FEED_URL = "https://www.elespectador.com/arc/outboundfeeds/news-sitemap/?outputType=xml"



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

function parseElespectadorDate(dateString: string): Date {
  // Dictionary to map Spanish month names to their numeric values
  const monthMap: Record<string, number> = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  console.log(`Attempting to parse date: "${dateString}"`);

  // Split the date and time parts
  const parts = dateString.split(' - ');
  if (parts.length !== 2) {
    throw new Error(`Invalid date format (missing separator): ${dateString}`);
  }

  // Parse date part: "12 de mayo de 2025"
  const dateParts = parts[0]!.split(' de ');
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date part format: ${parts[0]}`);
  }

  const day = parseInt(dateParts[0]!, 10);
  const monthName = dateParts[1]!.toLowerCase();
  const year = parseInt(dateParts[2]!, 10);

  // Validate month
  const monthNum = monthMap[monthName];
  if (monthNum === undefined) {
    throw new Error(`Invalid month name: ${monthName}`);
  }

  // Parse time part: "11:40 p. m."
  const timePart = parts[1]!.trim();
  const timeMatch = timePart.match(/(\d{1,2}):(\d{2})\s+([ap])\.\s*m\./i);

  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timePart}`);
  }

  const hour = parseInt(timeMatch[1]!, 10);
  const minute = parseInt(timeMatch[2]!, 10);
  const period = timeMatch[3]!.toLowerCase();

  // Handle 12-hour format
  let hourNum = hour;
  if (period === 'p') {
    if (hourNum !== 12) {
      hourNum += 12;
    }
  } else if (hourNum === 12) {
    hourNum = 0;
  }

  // Create date in local timezone
  const localDate = new Date(year, monthNum, day, hourNum, minute);

  // Convert to UTC
  const utcDate = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  );

  return utcDate;
}

const parseArticle = ($: cheerio.Root) => {

  let author = $(".ArticleHeader-Author").find("a").first().text()
  let dateText = $(".ArticleHeader-Date").text()
  console.log({
    author, dateText
  })
  let date = parseElespectadorDate(dateText)

  let articleText = '';
  
  // Extract article content from paragraphs
  
  // Find all h2 headers and paragraphs in the article content
  $(".Article-Content h2, .Article-Content p").each((_, elem) => {
    const element = $(elem);

    articleText += element.text() + '\n'
  });

  return {
    text: articleText.trim(),
    markdown: "",
    author: author || null,
    date
  };
}


const feedParser = createFeedParser(SITE_NAME, FEED_URL, parseFeed)
const articleParser = createArticleParser(SITE_NAME, parseArticle);


export const elEspectadorConfig: SiteConfig = {
  siteName: SITE_NAME,
  feedParser,
  articleParser
}
