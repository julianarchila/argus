
import * as cheerio from "cheerio";



export async function cherrioFromUrl(url: string): Promise<cheerio.Root> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const document = await response.text();
  return cheerio.load(document, { xmlMode: true });
}

