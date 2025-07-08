// Common types for both feed and article parsers

// Feed parser types
export interface FeedItem {
  url: string;
  title: string;
  publicationDate: Date;
  lastModified?: Date;
  keywords?: string;
}

export interface Article {
  url: string;
  title: string;
  text: string;
  markdown: string;
  author?: string;
  keywords?: string[];
}

export interface SiteFeedResult {
  siteName: string;
  lastProcessed: Date | null;
  items: FeedItem[];
  totalItemsFound: number;
}

export interface FeedParser {
  parse(): Promise<FeedItem[]>;
}

export interface ArticleParser {
  parse(url: string): Promise<Article>;
}

export interface SiteConfig {
  siteName: string;
  feedParser: FeedParser;
  articleParser: ArticleParser;
}