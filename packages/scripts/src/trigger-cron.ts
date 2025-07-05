import { Feed } from "@argus/core/feed";

/**
 * Manually trigger the feed cron job
 * This is useful for development when you don't want to wait for the scheduled cron
 */
export async function triggerFeedCron() {
  console.log("Manually triggering feed cron...");
  
  try {
    const result = await Feed.processCron({ devLimit: 5 });
    
    console.log("Feed cron triggered successfully!");
    console.log(`Processed ${result.processed} sites`);
    console.log(`Total new items: ${result.newItems}`);
    
    return result;
  } catch (error) {
    console.error("Error processing feeds:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  triggerFeedCron()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Failed to trigger feed cron:", error);
      process.exit(1);
    });
}