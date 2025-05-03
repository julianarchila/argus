import { eq } from "drizzle-orm";
import { getDb } from ".";
import { articlesTable, siteTrackingTable, InsertArticle } from "./schema.sql"

/**
 * Saves a batch of articles to the database for a specific site
 * @param articles - Array of article objects to be saved
 * @param site_name - Name of the site the articles belong to
 */
export const save_articles = async (articles: InsertArticle[], site_name: string) => {

  const db = getDb()

  for (const article of articles) {
    await db.insert(articlesTable)
      .values({
        url: article.url,
        text: article.text,
        markdown: article.markdown,
        author: article.author,
        publication_date: article.publication_date,
        lastmod: article.lastmod,
        site_name: site_name,
        keywords: article.keywords, // Should be an array/object, Drizzle will handle JSON
      })
      .onConflictDoNothing()
      .run();
  }

}

/**
 * Retrieves the last processed date for a specified site
 * @param site_name - Name of the site to retrieve the last processed date for
 * @returns Promise that resolves to the last processed date or null if not found
 */
export const get_last_proccessed_date = async (site_name: string) => {
  const db = getDb()

  const result = await db.select().from(siteTrackingTable).where(eq(siteTrackingTable.site_name, site_name));

  if (result.length !== 1) {
    console.warn(`No site tracking found for site ${site_name}`)
    return null;
  }

  const lastProcessedDate = result[0].last_processed;
  return lastProcessedDate;
}

/**
 * Updates the last processed date for a specified site
 * @param site_name - Name of the site to update
 * @param lastProcessedDate - New date to set as the last processed date
 */
export const update_last_proccessed_date = async (site_name: string, lastProcessedDate: Date) => {
  const db = getDb()

  await db.update(siteTrackingTable)
    .set({
      last_processed: lastProcessedDate,
    }).where(eq(siteTrackingTable.site_name, site_name))

}

