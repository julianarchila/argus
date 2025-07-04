import { event } from "sst/event";
import { ZodValidator } from "sst/event/validator";
import { z } from "zod";

// Create event builder with Zod validation and metadata
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

// Define events using SST's event builder pattern
export const NewArticlesEvent = defineEvent(
  "articles.new",
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
);

export const ArticleProcessedEvent = defineEvent(
  "articles.processed",
  z.object({
    articleId: z.number(),
    siteName: z.string(),
    url: z.string().url(),
  })
);

export const EmbeddingGeneratedEvent = defineEvent(
  "embeddings.generated",
  z.object({
    articleId: z.number(),
    embeddingId: z.string(),
    dimension: z.number(),
  })
);

export const ClusterUpdatedEvent = defineEvent(
  "clusters.updated",
  z.object({
    clusterId: z.string(),
    articleIds: z.array(z.number()),
    topicKeywords: z.array(z.string()),
    timestamp: z.string().datetime(),
  })
);

// Export all events for easy importing
export const Events = {
  NewArticlesEvent,
  ArticleProcessedEvent,
  EmbeddingGeneratedEvent,
  ClusterUpdatedEvent,
} as const;
