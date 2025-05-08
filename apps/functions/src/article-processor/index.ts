import * as parsers from "@argus/core/parsers";
import * as db from "@argus/core/database";
import * as events from "@argus/core/events"

export const handler = async (event: any) => {
  try {
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
        text: parsedArticle.text,
        markdown: parsedArticle.markdown,
        site_name: siteName,
        keywords: parsedArticle.keywords,
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
