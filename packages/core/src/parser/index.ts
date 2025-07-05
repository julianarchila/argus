import { Site } from "../site";
import { filterItemsByDate } from "./utils";
import { siteConfigs, getSiteConfig } from "./sites";
import type { Article, SiteFeedResult } from "./types";

export namespace Parser {
  // Types
  export type { Article, SiteFeedResult } from "./types";

  // Functions
  export const processSiteFeed = async (
    siteName: string, 
    options: { devLimit?: number } = {}
  ): Promise<SiteFeedResult> => {
    const siteConfig = getSiteConfig(siteName);
    
    if (!siteConfig) {
      throw new Error(`No configuration found for site: ${siteName}`);
    }
    
    const lastProcessed = await Site.getLastProcessed(siteName);
    const allItems = await siteConfig.feedParser.parse();
    let newItems = filterItemsByDate(allItems, lastProcessed);
    
    // Apply dev limit if specified
    if (options.devLimit && newItems.length > options.devLimit) {
      console.warn(`[LIMIT] Limiting ${siteName} from ${newItems.length} to ${options.devLimit} articles`);
      newItems = newItems.slice(0, options.devLimit);
    }
    
    // Only update the last processed date if we have items
    if (allItems.length > 0) {
      const latestDate = allItems.reduce((latest, item) => 
        item.publicationDate > latest ? item.publicationDate : latest, 
        allItems[0]!.publicationDate
      );
      
      await Site.updateLastProcessed(siteName, latestDate);
    }
    
    return {
      siteName,
      lastProcessed,
      items: newItems,
      totalItemsFound: allItems.length
    };
  };

  export const processArticle = async (url: string, siteName: string): Promise<Article> => {
    const siteConfig = getSiteConfig(siteName);
    
    if (!siteConfig) {
      throw new Error(`No configuration found for site: ${siteName}`);
    }
    
    return siteConfig.articleParser.parse(url);
  };

  export const processAllSites = async (options: { devLimit?: number } = {}): Promise<SiteFeedResult[]> => {
    const results = await Promise.all(
      siteConfigs.map(config => processSiteFeed(config.siteName, options))
    );
    
    return results;
  };
}