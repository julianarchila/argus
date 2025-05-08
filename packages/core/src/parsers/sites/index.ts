import { SiteConfig } from "../types";
import { elTiempoConfig } from "./elTiempo";

// Registry of all site configurations
export const siteConfigs: SiteConfig[] = [
  elTiempoConfig,
  // Add more site configurations here as they are implemented
];

// Helper to find a site configuration by name
export function getSiteConfig(siteName: string): SiteConfig | undefined {
  return siteConfigs.find(config => config.siteName === siteName);
}

// Export individual site configurations for direct import
export { elTiempoConfig }; 