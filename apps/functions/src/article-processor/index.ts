import * as parsers from "@argus/core/parsers";
import * as db from "@argus/core/database";
import * as events from "@argus/core/events"

/**
 * Lambda handler for processing articles from EventBridge events
 */
export const handler = async (event: any) => {
  try {
    const normalizedEvent = normalizeEvent(event);
    if (!normalizedEvent) {
      console.log("Received unsupported event format:", JSON.stringify(event, null, 2));
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Unsupported event format" })
      };
    }
    
    return await processArticles(normalizedEvent);
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

/**
 * Normalize different event formats into a standard structure
 */
function normalizeEvent(event: any): any {
  // Case 1: SQS event with EventBridge payload
  if (Array.isArray(event.Records) && event.Records.length > 0) {
    const record = event.Records[0];
    if (record.eventSource === 'aws:sqs') {
      try {
        const body = JSON.parse(record.body);
        if (body.detail) {
          return {
            ...body,
            detailType: body.detailType || body['detail-type']
          };
        }
      } catch (e) {
        console.error("Error parsing SQS message:", e);
      }
    }
    return null;
  }
  
  // Case 2: Direct EventBridge invocation
  if (event.detail) {
    return {
      ...event,
      detailType: event.detailType || event['detail-type']
    };
  }
  
  // Unsupported format
  return null;
}

/**
 * Process articles from the normalized event
 */
async function processArticles(event: any) {
  // Parse and validate the incoming event
  const { siteName, articles } = events.parseEvent<"NewArticlesEvent">(event);
  
  console.log(`Processing ${articles.length} articles for ${siteName}`);
  
  const results = [];
  // Process each article
  for (const article of articles) {
    try {
      const result = await processArticle(article, siteName);
      results.push(result);
    } catch (error) {
      console.error(`Error processing article ${article.url}:`, error);
      results.push({ url: article.url, error: String(error) });
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Processed ${articles.length} articles for ${siteName}`,
      results
    })
  };
}

/**
 * Process a single article
 */
async function processArticle(article: any, siteName: string) {
  // Extract the article content using the appropriate parser
  const parsedArticle = await parsers.processArticle(article.url, siteName);
  
  // Store in database
  const savedArticle = await db.saveArticle({
    url: article.url,
    title: article.title,
    text: parsedArticle.text,
    markdown: parsedArticle.markdown,
    site_name: siteName,
    keywords: parsedArticle.keywords,
    author: parsedArticle.author,
    publication_date: article.publicationDate,
    lastmod: article.lastModified,
  });
  
  // Publish event for downstream processing
  // await events.publishEvent(
  //   "ArticleProcessedEvent",
  //   "argus.articleprocessor",
  //   {
  //     articleId: savedArticle.id,
  //     siteName,
  //     url: article.url
  //   }
  // );
  
  return { id: savedArticle.id, url: article.url, processed: true };
}
