
import * as cheerio from "cheerio";


/**
 * Fetches HTML or XML content from a URL and loads it into a Cheerio parser instance
 * 
 * @param options - Function parameters
 * @param options.url - The URL to fetch content from
 * @param options.xml - Whether to parse the content as XML (default: false)
 * @returns A Cheerio root object that can be used to query and manipulate the document
 * @throws Error if the HTTP request fails
 */
export async function cherrioFromUrl({
  url,
  xml = false
}: {
  url: string;
  xml?: boolean;
}): Promise<cheerio.Root> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const document = await response.text();

  if (xml) {
    return cheerio.load(document, { xmlMode: true });
  }
  return cheerio.load(document);

}
