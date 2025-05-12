import * as events from "@argus/core/events/index";
import type { SiteFeedResult } from "@argus/core/parsers/index";
import * as parsers from "@argus/core/parsers/index";

export const handler = async (event: any, context: any) => {
  try {
    // Call the parsers function to get all feeds
    const results = await parsers.processAllSites();

    // Log results for each site
    for (const result of results) {

      if (result.items.length > 0) {
        // Publish events in parallel using Promise.all
        await Promise.all(
          result.items.map(item => 
            events.publishEvent("NewArticlesEvent", "argus.feedcron", {
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
        );
        
        console.log(`Published ${result.items.length} individual events for ${result.siteName}`);
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
