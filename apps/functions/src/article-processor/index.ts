import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { NewArticlesEvent, ArticleProcessedEvent } from "@argus/core/events/schema";
import * as parsers from "@argus/core/parsers/index";
import * as db from "@argus/core/database/index";

export const handler = bus.subscriber([NewArticlesEvent], async (event) => {
  try {
    if (event.type === "articles.new") {
      const { siteName, articles } = event.properties;
      
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

      console.log(`Processed ${articles.length} articles for ${siteName}`, { results });
    }
  } catch (error) {
    console.error("Error in article processor:", error);
    throw error; // Re-throw to trigger retry
  }
});

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
  await bus.publish(Resource.ArgusEventBus, ArticleProcessedEvent, {
    articleId: savedArticle.id,
    siteName,
    url: article.url
  });

  return { id: savedArticle.id, url: article.url, processed: true };
}
