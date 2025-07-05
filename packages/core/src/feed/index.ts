import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { Feed as FeedEvents } from "./events";
import { Parser } from "../parser";

export namespace Feed {
  export interface CronResult {
    processed: number;
    newItems: number;
    sites: Array<{
      siteName: string;
      lastProcessed: string | null;
      newItems: number;
      totalItems: number;
    }>;
  }

  export const processCron = async (options: { devLimit?: number } = {}): Promise<CronResult> => {
    console.log("Executing feed cron job...");
    
    // Auto-detect dev mode and set appropriate limits
    const isProduction = process.env.SST_STAGE === "production";
    const defaultDevLimit = isProduction ? undefined : 3;
    const finalOptions = {
      ...options,
      devLimit: options.devLimit ?? defaultDevLimit
    };
    
    console.log(`Running with devLimit: ${finalOptions.devLimit} (production: ${isProduction})`);
    
    // Process all sites
    const results = await Parser.processAllSites(finalOptions);

    // Process and publish events for each site
    for (const result of results) {
      if (result.items.length > 0) {
        // Publish feed discovery event
        await bus.publish(Resource.ArgusEventBus, FeedEvents.Events.ArticlesDiscovered, {
          siteName: result.siteName,
          articles: result.items.map(item => ({
            url: item.url,
            title: item.title,
            publicationDate: item.publicationDate.toISOString(),
            lastModified: item.lastModified?.toISOString(),
            keywords: item.keywords
          }))
        });
        
        console.log(`Published feed discovery event for ${result.siteName} with ${result.items.length} articles`);
      }

      console.log({
        site_name: result.siteName,
        lastProcessed: result.lastProcessed,
        newItems: result.items.length,
        totalItems: result.totalItemsFound
      });
    }

    const totalNewItems = results.reduce((total, result) => total + result.items.length, 0);
    
    console.log(`Feed cron completed successfully - processed ${results.length} sites, found ${totalNewItems} new items`);

    return {
      processed: results.length,
      newItems: totalNewItems,
      sites: results.map(result => ({
        siteName: result.siteName,
        lastProcessed: result.lastProcessed?.toISOString() || null,
        newItems: result.items.length,
        totalItems: result.totalItemsFound
      }))
    };
  };
}