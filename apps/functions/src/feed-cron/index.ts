import { processAllSites } from "@argus/core/feed-parser/index";

export const handler = async (event: any, context: any) => {

  const results = await processAllSites();

  for (const result of results) {
    console.log({
      site_name: result.site_name,
      lastProcessed: result.lastProcessed,
      items: result.items.length
    })
  }


  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Hello World"
    })
  }
}
