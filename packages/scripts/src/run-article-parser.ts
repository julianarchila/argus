import { Resource } from "sst";
import { Article } from "@argus/core/article";
import { Parser } from "@argus/core/parser";

// Get command line arguments (excluding 'node' and script name)
const args = process.argv.slice(2);

// Check if a value was provided
if (args.length < 2) {
  console.error("Error: you must provide a site name and a url");
  process.exit(1);
}

// Get the first argument
const siteName = args[0] || "";
const url = args[1] || "";

try {
  const parsedArticle = await Parser.processArticle(url, siteName);
  
  // Use Article.create instead of Article.save (following SST pattern)
  const savedArticle = await Article.create({
    url,
    title: parsedArticle.title,
    text: parsedArticle.text,
    markdown: parsedArticle.markdown,
    site_name: siteName,
    keywords: parsedArticle.keywords,
    author: parsedArticle.author,
    publication_date: new Date().toISOString(),
    lastmod: new Date().toISOString(),
  });

  console.log("Article processed and saved:", savedArticle);
} catch (error) {
  console.error("Article processing failed:", error);
  process.exit(1);
}

