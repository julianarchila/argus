import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { articlesTable, siteTrackingTable, InsertArticle } from "./schema.sql"

/**
 * Save article to database
 * This function will insert a new article or update an existing one based on URL
 */
export async function saveArticle(article: InsertArticle) {
  const db = getDb()
  try {
    return await db.insert(articlesTable).values({
      url: article.url,
      title: article.title || null,
      text: article.text,
      markdown: article.markdown,
      author: article.author,
      publication_date: article.publication_date,
      lastmod: article.lastmod,
      site_name: article.site_name,
      keywords: article.keywords,
    })
    .onConflictDoUpdate({
      target: articlesTable.url,
      set: {
        title: article.title || null,
        text: article.text,
        markdown: article.markdown,
        author: article.author,
        publication_date: article.publication_date,
        lastmod: article.lastmod,
        site_name: article.site_name,
        keywords: article.keywords,
      }
    })
    .returning()
    .get();
  } catch (error) {
    console.error(`Error saving article ${article.url}:`, error);
    throw error;
  }
}

/**
 * Save multiple articles to the database
 * Each article will be inserted or updated based on URL
 */
export async function saveArticles(articles: InsertArticle[]) {
  const results = [];
  
  for (const article of articles) {
    try {
      const result = await saveArticle(article);
      results.push(result);
    } catch (error) {
      console.error(`Error saving article ${article.url}:`, error);
      results.push({ url: article.url, error: String(error) });
    }
  }
  
  return results;
}

/**
 * Get the last processed date for a site
 */
export async function getLastProcessedDate(siteName: string) {
  const db = getDb()
  
  const result = await db.select()
    .from(siteTrackingTable)
    .where(eq(siteTrackingTable.site_name, siteName));

  if (result.length !== 1) {
    console.warn(`No site tracking found for site ${siteName}`)
    return null;
  }

  return result[0]!.last_processed;
}

/**
 * Update the last processed date for a site
 */
export async function updateLastProcessedDate(siteName: string, lastProcessedDate: Date) {
  const db = getDb()

  return await db.insert(siteTrackingTable)
    .values({
      site_name: siteName,
      last_processed: lastProcessedDate,
    })
    .onConflictDoUpdate({
      target: siteTrackingTable.site_name,
      set: {
        last_processed: lastProcessedDate,
      }
    });
}

// Legacy exports for backward compatibility
export const save_articles = saveArticles;
export const get_last_proccessed_date = getLastProcessedDate;
export const update_last_proccessed_date = updateLastProcessedDate;

