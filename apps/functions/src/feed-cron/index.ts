import { Feed } from "@argus/core/feed";

export const handler = async () => {
  try {
    const result = await Feed.processCron();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Feed processing completed successfully",
        processed: result.processed,
        newItems: result.newItems
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
};
