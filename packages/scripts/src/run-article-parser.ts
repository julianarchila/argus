import { Resource } from "sst"

import { getSiteConfig } from "@argus/core/parsers/index"


// Get command line arguments (excluding 'node' and script name)
const args = process.argv.slice(2);

// Check if a value was provided
if (args.length < 2) {
  console.error("Error: you must provide a site name and a url")
  process.exit(1);
}

// Get the first argument
const siteName = args[0] || "";
const url = args[1] || ""

const siteConfig = getSiteConfig(siteName)

if (!siteConfig) {
  console.error("Error: no configuration registered for " + siteName)
  process.exit(1);
}

try {
  const res = await siteConfig.articleParser.parse(url)
  
  console.log({
    article: res
  })
} catch (error) {
  console.error("Error parsing article:", error.message);
  process.exit(1);
}

