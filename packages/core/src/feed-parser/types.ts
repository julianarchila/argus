export type FeedItem = {
  url: string;
  lastModified?: Date;
  publicationDate: Date;
  title: string;
  keywords: string;
}

export type FeedParser = () => Promise<FeedItem[]>;

// CONSTANTS
export const ELTIEMPO_FEED_URL = "https://www.eltiempo.com/sitemap-google-news.xml";
