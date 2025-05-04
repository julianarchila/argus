
import { elTiempoFeedParser } from "./elTiempo";
import { FeedParser } from "./types";
import { get_last_proccessed_date } from "../database/queries";
import { parseFeed } from "./feed-parser";


const sitesRegistry: { name: string, parser: FeedParser }[] = [
  {
    name: "elTiempo",
    parser: elTiempoFeedParser
  },
]

export const processFeed = async ({
  site_name,
  parser
}: {
  site_name: string,
  parser: FeedParser
}) => {
  const lastProcessed = await get_last_proccessed_date(site_name);
  const items = await parseFeed(parser, lastProcessed);


  return {
    site_name,
    items,
    lastProcessed
  }
}
export const processAllSites = async () => {
  const results = await Promise.all(sitesRegistry.map((site) => processFeed({
    site_name: site.name,
    parser: site.parser
  })))

  return results;
}
