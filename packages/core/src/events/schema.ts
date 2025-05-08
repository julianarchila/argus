import { z } from "zod";
import { FeedItem, Article } from "../parsers/types";

// Base event structure
export const BaseEventSchema = z.object({
  source: z.string(),
  detailType: z.string(),
  time: z.string().datetime().optional(),
  id: z.string().optional(),
});

// Define schemas for each event type
export const NewArticlesEventSchema = z.object({
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
});

export const ArticleProcessedEventSchema = z.object({
  articleId: z.number(),
  siteName: z.string(),
  url: z.string().url(),
});

export const EmbeddingGeneratedEventSchema = z.object({
  articleId: z.number(),
  embeddingId: z.string(),
  dimension: z.number(),
});

export const ClusterUpdatedEventSchema = z.object({
  clusterId: z.string(),
  articleIds: z.array(z.number()),
  topicKeywords: z.array(z.string()),
  timestamp: z.string().datetime(),
});

// Event type lookup by name
export const EventSchemas = {
  "NewArticlesEvent": NewArticlesEventSchema,
  "ArticleProcessedEvent": ArticleProcessedEventSchema,
  "EmbeddingGeneratedEvent": EmbeddingGeneratedEventSchema,
  "ClusterUpdatedEvent": ClusterUpdatedEventSchema,
} as const;

// TypeScript types derived from schemas
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type NewArticlesEvent = z.infer<typeof NewArticlesEventSchema>;
export type ArticleProcessedEvent = z.infer<typeof ArticleProcessedEventSchema>;
export type EmbeddingGeneratedEvent = z.infer<typeof EmbeddingGeneratedEventSchema>;
export type ClusterUpdatedEvent = z.infer<typeof ClusterUpdatedEventSchema>;

// Type mapping for TypeScript
export type EventDetailType = keyof typeof EventSchemas;
export type EventDetail<T extends EventDetailType> = z.infer<typeof EventSchemas[T]>;
