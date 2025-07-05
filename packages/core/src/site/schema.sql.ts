import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const siteTrackingTable = sqliteTable('site_tracking', {
  site_name: text('site_name').primaryKey(),
  last_processed: integer('last_processed', { mode: 'timestamp' }),
});

export type SelectSiteTracking = typeof siteTrackingTable.$inferSelect;
export type InsertSiteTracking = typeof siteTrackingTable.$inferInsert;