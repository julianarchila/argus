import { Resource } from "sst";
import { getSiteConfig } from "@argus/core/parser/sites";

// Get command line arguments (excluding 'node' and script name)
const args = process.argv.slice(2);

// Check if a value was provided
if (args.length === 0) {
  console.error("Error: no site name provided.");
  process.exit(1);
}

// Get the first argument
const siteName = args[0] || "";

const siteConfig = getSiteConfig(siteName);

if (!siteConfig) {
  console.error("Error: no configuration registered for " + siteName);
  process.exit(1);
}

const res = await siteConfig.feedParser.parse();

console.log({
  length: res.length,
  first5: res.slice(0, 5)
});

