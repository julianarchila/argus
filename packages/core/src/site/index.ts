import { eq } from "drizzle-orm";
import { getDb } from "../shared/database";
import { siteTrackingTable, type InsertSiteTracking, type SelectSiteTracking } from "./schema";

export namespace Site {
  // Types first (following SST pattern)
  export type Insert = InsertSiteTracking;
  export type Select = SelectSiteTracking;

  // Functions (following SST pattern)
  export const create = async (siteName: string, lastProcessed?: Date): Promise<SelectSiteTracking> => {
    const db = getDb();
    
    return await db.insert(siteTrackingTable)
      .values({
        site_name: siteName,
        last_processed: lastProcessed || new Date(),
      })
      .onConflictDoUpdate({
        target: siteTrackingTable.site_name,
        set: {
          last_processed: lastProcessed || new Date(),
        }
      })
      .returning()
      .get();
  };

  export const fromName = async (siteName: string): Promise<SelectSiteTracking | null> => {
    const db = getDb();
    
    const result = await db.select()
      .from(siteTrackingTable)
      .where(eq(siteTrackingTable.site_name, siteName))
      .limit(1);

    return result[0] || null;
  };

  export const getLastProcessed = async (siteName: string): Promise<Date | null> => {
    const site = await fromName(siteName);
    return site?.last_processed || null;
  };

  export const update = async (siteName: string, lastProcessedDate: Date): Promise<SelectSiteTracking> => {
    const db = getDb();

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
      })
      .returning()
      .get();
  };

  // Legacy function for backward compatibility (will be removed)
  export const updateLastProcessed = update;
}