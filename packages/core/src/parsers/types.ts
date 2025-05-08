// Common types for both feed and article parsers

// Feed parser types
export type FeedItem = {
  url: string;
  lastModified?: Date;
  publicationDate: Date;
  title: string;
  keywords: string;
}

export type FeedParser = {
  siteName: string;
  parse: () => Promise<FeedItem[]>;
}

// Result type for site feed processing
export type SiteFeedResult = {
  siteName: string;
  lastProcessed: Date | null;
  items: FeedItem[];
  totalItemsFound: number;
}

// Article parser types
export type Article = {
  url: string;
  text: string;
  markdown: string;
  author: string | null;
  date: Date | null;
  siteName: string;
  keywords?: string[];
}

export type ArticleParser = {
  siteName: string;
  parse: (url: string) => Promise<Article>;
}

// Common registry type for site configurations
export type SiteConfig = {
  siteName: string;
  feedParser: FeedParser;
  articleParser: ArticleParser;
} 