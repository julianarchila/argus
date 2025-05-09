import { getLastProcessedDate, updateLastProcessedDate } from "../database/queries";
import { filterItemsByDate } from "./parser-utils";
import { siteConfigs, getSiteConfig } from "./sites";
import { Article, FeedItem } from "./types";

// Export types and utilities for direct access
export * from "./types";
export * from "./parser-utils";
export * from "./sites";

/**
 * Process feed for a specific site to get new articles
 * 
 * @param siteName - Name of the site to process
 * @returns List of new articles and metadata
 */
export async function processSiteFeed(siteName: string) {
  const siteConfig = getSiteConfig(siteName);
  
  if (!siteConfig) {
    throw new Error(`No configuration found for site: ${siteName}`);
  }
  
  const lastProcessed = await getLastProcessedDate(siteName);
  const allItems = await siteConfig.feedParser.parse();
  const newItems = filterItemsByDate(allItems, lastProcessed);
  
  // Only update the last processed date if we have items
  if (allItems.length > 0) {
    const latestDate = allItems.reduce((latest, item) => 
      item.publicationDate > latest ? item.publicationDate : latest, 
      allItems[0].publicationDate
    );
    
    await updateLastProcessedDate(siteName, latestDate);
  }
  
  return {
    siteName,
    lastProcessed,
    items: newItems,
    totalItemsFound: allItems.length
  };
}

/**
 * Process article content for a specific URL and site
 * 
 * @param url - URL of the article to process
 * @param siteName - Name of the site the article belongs to
 * @returns Parsed article content
 */
export async function processArticle(url: string, siteName: string): Promise<Article> {
  const siteConfig = getSiteConfig(siteName);
  
  if (!siteConfig) {
    throw new Error(`No configuration found for site: ${siteName}`);
  }
  
  return siteConfig.articleParser.parse(url);
}

/**
 * Process all configured sites and return new articles
 * 
 * @returns Results for all sites
 */
export async function processAllSites() {
  const results = await Promise.all(
    siteConfigs.map(config => processSiteFeed(config.siteName))
  );
  
  return results;
} 