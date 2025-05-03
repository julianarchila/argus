import { elTiempoFeedParser } from "./feed-parser/elTiempo";
import { parseFeed } from "./feed-parser/feed-parser";
async function main() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const items = await parseFeed(elTiempoFeedParser, yesterday);

  console.log(items.length);
  // log first 5 items
  console.log(items.slice(0, 5));
}

await main();
