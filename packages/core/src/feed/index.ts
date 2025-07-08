import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { z } from "zod";
import { defineEvent } from "../event";
import { Parser } from "../parser";

export namespace Feed {
  // Events (following SST pattern)
  export const Events = {
    ArticlesDiscovered: defineEvent(
      "feed.articles.discovered",
      z.object({
        siteName: z.string(),
        articles: z.array(
          z.object({
            url: z.string().url(),
            title: z.string(),
            publicationDate: z.string().datetime(),
            lastModified: z.string().datetime().optional(),
            keywords: z.string().optional(),
          })
        ),
      })
    ),
    
    ProcessingCompleted: defineEvent(
      "feed.processing.completed",
      z.object({
        siteName: z.string(),
        processedCount: z.number(),
        totalCount: z.number(),
      })
    ),
  };

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
        await bus.publish(Resource.ArgusEventBus, Events.ArticlesDiscovered, {
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