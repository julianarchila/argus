import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { Feed } from "@argus/core/feed/events";
import { Article } from "@argus/core/article";
import { Parser } from "@argus/core/parser";

// Follow SST subscriber pattern for event handling
export const handler = bus.subscriber([Feed.Events.ArticlesDiscovered], async (event) => {
  try {
    if (event.type === "feed.articles.discovered") {
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

async function processArticle(article: any, siteName: string) {
  // Extract the article content using the appropriate parser
  const parsedArticle = await Parser.processArticle(article.url, siteName);

  // Store in database using namespace pattern (Article.create instead of Article.save)
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
