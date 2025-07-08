import { bus } from "sst/aws/bus";
import { Feed } from "@argus/core/feed";
import { Article } from "@argus/core/article";
import { Parser } from "@argus/core/parser";

export const handler = bus.subscriber(
  [
    Feed.Events.ArticlesDiscovered,
    Article.Events.Created,
    Article.Events.Updated,
    Article.Events.Processed,
  ],
  async (event) => {
    try {
      console.log("Received event:", {
        type: event.type,
        ...event.properties,
      });

      switch (event.type) {
        case "feed.articles.discovered": {
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
          break;
        }

        case "article.created": {
          const { articleId, siteName } = event.properties;
          console.log(`Article created: ${articleId} from ${siteName}`);
          // Future: Add embedding generation, clustering, etc.
          break;
        }

        case "article.updated": {
          const { articleId, siteName } = event.properties;
          console.log(`Article updated: ${articleId} from ${siteName}`);
          // Future: Re-process embeddings if content changed
          break;
        }

        case "article.processed": {
          const { articleId, siteName } = event.properties;
          console.log(`Article processed: ${articleId} from ${siteName}`);
          // Future: Trigger ML pipeline, notifications, etc.
          break;
        }

        default:
          console.warn(`Unhandled event type: ${(event as any).type}`);
      }
    } catch (error) {
      console.error("Error in event handler:", error);
      throw error; // Re-throw to trigger retry
    }
  }
);

async function processArticle(article: any, siteName: string) {
  // Extract the article content using the appropriate parser
  const parsedArticle = await Parser.processArticle(article.url, siteName);

  // Store in database using namespace pattern
  const savedArticle = await Article.create({
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

  return { id: savedArticle.id, url: article.url, processed: true };
}
