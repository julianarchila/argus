import type { SiteFeedResult } from "@argus/core/parsers";
import * as parsers from "@argus/core/parsers";

export const handler = async (event: any, context: any) => {
  try {
    // Call the parsers function to get all feeds
    const results = await parsers.processAllSites();

    // Log results for each site
    for (const result of results) {
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
