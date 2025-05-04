import { FeedItem, FeedParser } from "./types";

export async function parseFeed(parser: FeedParser, lastProcessed?: Date | null): Promise<FeedItem[]> {
  const items = await parser();
  if (!lastProcessed) return items;
  return items.filter(item => item.publicationDate && item.publicationDate > lastProcessed);
}
