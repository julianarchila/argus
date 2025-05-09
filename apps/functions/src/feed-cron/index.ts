import * as events from "@argus/core/events";
import type { SiteFeedResult } from "@argus/core/parsers";
import * as parsers from "@argus/core/parsers";

// Helper function to chunk array into smaller batches
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export const handler = async (event: any, context: any) => {
  try {
    // Call the parsers function to get all feeds
    const results = await parsers.processAllSites();

    // Log results for each site
    for (const result of results) {

      if (result.items.length > 0) {
        // Batch articles into chunks of max 10 articles per event
        // Adjust this number as needed based on your article sizes
        const BATCH_SIZE = 50; 
        const articleChunks = chunkArray(result.items, BATCH_SIZE);
        
        // Process each chunk separately
        for (const chunk of articleChunks) {
          await events.publishEvent("NewArticlesEvent", "argus.feedcron", {
            siteName: result.siteName,
            articles: chunk.map(item => ({
              url: item.url,
              title: item.title,
              publicationDate: item.publicationDate.toISOString(),
              lastModified: item.lastModified?.toISOString(),
              keywords: item.keywords
            }))
          });
        }
        
        console.log(`Published ${articleChunks.length} events for ${result.siteName} with ${result.items.length} new articles`);
      }

      console.log({
        site_name: result.siteName,
        lastProcessed: result.lastProcessed,
        newItems: result.items.length,
        totalItems: result.totalItemsFound
      });
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Feed processing completed successfully",
        processed: results.length,
        newItems: results.reduce((total: number, result: SiteFeedResult) => total + result.items.length, 0)
      })
    };
  } catch (error) {
    console.error("Error processing feeds:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Error processing feeds",
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
}
