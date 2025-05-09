import * as parsers from "@argus/core/parsers";
import * as db from "@argus/core/database";
import * as events from "@argus/core/events"

export const handler = async (event: any) => {
  try {
    // Check if this is a direct invocation or an EventBridge event
    // EventBridge events come in the Records array and are structured differently
    
    // Handle standard EventBridge events format (AWS Lambda SQS integration)
    if (Array.isArray(event.Records) && event.Records.length > 0) {
      const record = event.Records[0];
      
      // Extract the actual event from the EventBridge envelope
      if (record.eventSource === 'aws:sqs') {
        try {
          const body = JSON.parse(record.body);
          if (body.detail && (body.detailType || body['detail-type'])) {
            // Process this EventBridge event
            return await processEventBridgeEvent(body);
          }
        } catch (e) {
          console.error("Error parsing SQS message:", e);
        }
      }
    } 
    
    // If it's a direct EventBridge invocation (when using EventBridge triggers directly)
    // Support both camelCase (detailType) and kebab-case (detail-type) formats
    if (event.detail && (event.detailType || event['detail-type'])) {
      // Normalize the event format before processing
      const normalizedEvent = {
        ...event,
        detailType: event.detailType || event['detail-type']
      };
      return await processEventBridgeEvent(normalizedEvent);
    }
    
    // Otherwise, assume it's a direct API/test invocation
    console.log("Received direct invocation event:", JSON.stringify(event, null, 2));
    throw new Error("Unsupported event format");
  } catch (error) {
    console.error("Error processing articles:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing articles",
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

// Extract the processing logic to a separate function
async function processEventBridgeEvent(event: any) {
  // Parse and validate the incoming event
  const { siteName, articles } = events.parseEvent<"NewArticlesEvent">(event);
  
  console.log(`Processing ${articles.length} articles for ${siteName}`);
  
  // Process each article
  for (const article of articles) {
    // Extract the article content using the appropriate parser
    const parsedArticle = await parsers.processArticle(article.url, siteName);
    
    // Store in database
    const savedArticle = await db.saveArticle({
      url: article.url,
      title: article.title, // Use the title from the feed event
      text: parsedArticle.text,
      markdown: parsedArticle.markdown,
      site_name: siteName,
      keywords: parsedArticle.keywords,
      author: parsedArticle.author,
      publication_date: article.publicationDate, // From the feed event
      lastmod: article.lastModified, // Optional last modified date
    });
    
    // Type-safe publishing
    await events.publishEvent(
      "ArticleProcessedEvent",
      "argus.articleprocessor",
      {
        articleId: savedArticle.id,
        siteName,
        url: article.url
      }
    );
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Successfully processed ${articles.length} articles for ${siteName}`
    })
  };
}
