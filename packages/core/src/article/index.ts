import { eq } from "drizzle-orm";
import { bus } from "sst/aws/bus";
import { Resource } from "sst";
import { z } from "zod";
import { getDb } from "../shared/database";
import { articlesTable, type InsertArticle, type SelectArticle } from "./schema.sql";
import { defineEvent } from "../event";

export namespace Article {
  // Events (following SST pattern)
  export const Events = {
    Created: defineEvent(
      "article.created",
      z.object({
        articleId: z.number(),
        url: z.string().url(),
        siteName: z.string(),
      })
    ),
    
    Updated: defineEvent(
      "article.updated",
      z.object({
        articleId: z.number(),
        url: z.string().url(),
        siteName: z.string(),
      })
    ),
    
    Processed: defineEvent(
      "article.processed",
      z.object({
        articleId: z.number(),
        siteName: z.string(),
        url: z.string().url(),
      })
    ),
  };

  // Types first (following SST pattern)
  export type Insert = InsertArticle;
  export type Select = SelectArticle;

  // Functions (following SST pattern)
  export const create = async (article: Insert): Promise<SelectArticle> => {
    const db = getDb();
    try {
      const savedArticle = await db.insert(articlesTable).values({
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

      // Publish domain event (following SST event pattern)
      await bus.publish(Resource.ArgusEventBus, Events.Created, {
        articleId: savedArticle.id,
        url: savedArticle.url,
        siteName: savedArticle.site_name,
      });

      return savedArticle;
    } catch (error) {
      console.error(`Error creating article ${article.url}:`, error);
      throw error;
    }
  };

  export const fromID = async (id: number): Promise<SelectArticle | null> => {
    const db = getDb();
    const result = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, id))
      .limit(1);
    
    return result[0] || null;
  };

  export const fromURL = async (url: string): Promise<SelectArticle | null> => {
    const db = getDb();
    const result = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.url, url))
      .limit(1);
    
    return result[0] || null;
  };

  export const update = async (id: number, updates: Partial<Insert>): Promise<SelectArticle> => {
    const db = getDb();
    try {
      const updatedArticle = await db.update(articlesTable)
        .set(updates)
        .where(eq(articlesTable.id, id))
        .returning()
        .get();

      // Publish domain event
      await bus.publish(Resource.ArgusEventBus, Events.Updated, {
        articleId: updatedArticle.id,
        url: updatedArticle.url,
        siteName: updatedArticle.site_name,
      });

      return updatedArticle;
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw error;
    }
  };

  // Legacy function for backward compatibility (will be removed)
  export const save = create;
  export const saveMany = async (articles: Insert[]): Promise<Array<SelectArticle | { url: string; error: string }>> => {
    const results = [];
    
    for (const article of articles) {
      try {
        const result = await create(article);
        results.push(result);
      } catch (error) {
        console.error(`Error creating article ${article.url}:`, error);
        results.push({ url: article.url, error: String(error) });
      }
    }
    
    return results;
  };
}