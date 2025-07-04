import { bus } from "sst/aws/bus"
import { Resource } from "sst"
import { NewArticlesEvent } from "../events/schema"
import type { SiteFeedResult } from "../parsers/index"
import * as parsers from "../parsers/index"

export interface FeedCronResult {
  processed: number
  newItems: number
  sites: Array<{
    siteName: string
    lastProcessed: string | null
    newItems: number
    totalItems: number
  }>
}

/**
 * Executes the feed cron job logic
 * This function is shared between the scheduled Lambda and manual trigger script
 */
export async function executeFeedCron(options: { devLimit?: number } = {}): Promise<FeedCronResult> {
  console.log("Executing feed cron job...")
  
  // Auto-detect dev mode and set appropriate limits
  const isProduction = process.env.SST_STAGE === "production"
  const defaultDevLimit = isProduction ? undefined : 3
  const finalOptions = {
    ...options,
    devLimit: options.devLimit ?? defaultDevLimit
  }
  
  console.log(`Running with devLimit: ${finalOptions.devLimit} (production: ${isProduction})`)
  
  // Call the parsers function to get all feeds
  const results = await parsers.processAllSites(finalOptions)

  // Process and publish events for each site
  for (const result of results) {
    if (result.items.length > 0) {
      // Publish events in parallel using Promise.all
      await Promise.all(
        result.items.map(item => 
          bus.publish(Resource.ArgusEventBus, NewArticlesEvent, {
            siteName: result.siteName,
            articles: [{
              url: item.url,
              title: item.title,
              publicationDate: item.publicationDate.toISOString(),
              lastModified: item.lastModified?.toISOString(),
              keywords: item.keywords
            }]
          })
        )
      )
      
      console.log(`Published ${result.items.length} individual events for ${result.siteName}`)
    }

    console.log({
      site_name: result.siteName,
      lastProcessed: result.lastProcessed,
      newItems: result.items.length,
      totalItems: result.totalItemsFound
    })
  }

  const totalNewItems = results.reduce((total: number, result: SiteFeedResult) => total + result.items.length, 0)
  
  console.log(`Feed cron completed successfully - processed ${results.length} sites, found ${totalNewItems} new items`)

  return {
    processed: results.length,
    newItems: totalNewItems,
    sites: results.map(result => ({
      siteName: result.siteName,
      lastProcessed: result.lastProcessed?.toISOString() || null,
      newItems: result.items.length,
      totalItems: result.totalItemsFound
    }))
  }
}