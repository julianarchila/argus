import { elTiempoArticleParser } from "./article-parser/elTiempo";
import { update_last_proccessed_date } from "./database/queries";
import { elTiempoFeedParser } from "./feed-parser/elTiempo";
import { parseFeed } from "./feed-parser/feed-parser";

async function testElTiempoFeedParser() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const items = await parseFeed(elTiempoFeedParser, yesterday);

  console.log(items.length);
  // log first 5 items
  console.log(items.slice(0, 5));
}

async function testElTiempoArticleParser() {

  const URL = "https://www.eltiempo.com/deportes/futbol-internacional/eliminatoria-al-mundial-2026-asi-marcha-la-seleccion-colombia-en-la-tabla-de-posiciones-antes-de-visitar-brasil-3436789"

  const article = await elTiempoArticleParser(URL);
  console.log(article);

}


async function main() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  console.log("updating last processed date for elTiempo");
  await update_last_proccessed_date("elTiempo", yesterday);
  console.log("done");
}

(async () => {
  await main();
})();

