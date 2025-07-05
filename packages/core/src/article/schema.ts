import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const articlesTable = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull().unique(),
  title: text('title'),
  text: text('text').notNull(),
  markdown: text('markdown').notNull(),
  author: text('author'),
  publication_date: text('publication_date'),
  lastmod: text('lastmod'),
  site_name: text('site_name').notNull(),
  keywords: blob('keywords', { mode: 'json' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`),
});

export type SelectArticle = typeof articlesTable.$inferSelect;
export type InsertArticle = typeof articlesTable.$inferInsert;