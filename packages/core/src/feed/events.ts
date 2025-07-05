import { event } from "sst/event";
import { ZodValidator } from "sst/event/validator";
import { z } from "zod";

// Create event builder with Zod validation (following SST pattern)
const defineEvent = event.builder({
  validator: ZodValidator,
  metadata() {
    return {
      timestamp: new Date().toISOString(),
      source: "argus",
      version: "1.0",
      correlationId: crypto.randomUUID(),
    };
  },
});

// Define domain events (following SST naming pattern)
export namespace Feed {
  export const Events = {
    ArticlesDiscovered: defineEvent(
      "feed.articles.discovered",
      z.object({
        siteName: z.string(),
        articles: z.array(
          z.object({
            url: z.string().url(),
            title: z.string(),
            publicationDate: z.string().datetime(),
            lastModified: z.string().datetime().optional(),
            keywords: z.string().optional(),
          })
        ),
      })
    ),
    
    ProcessingCompleted: defineEvent(
      "feed.processing.completed",
      z.object({
        siteName: z.string(),
        processedCount: z.number(),
        totalCount: z.number(),
      })
    ),
  };
}