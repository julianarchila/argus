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
export namespace Article {
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
}