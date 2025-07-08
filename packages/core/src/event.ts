import { event } from "sst/event";
import { ZodValidator } from "sst/event/validator";

/**
 * Centralized event builder utility for Argus domain events
 * 
 * This utility provides a consistent way to define events across all domains
 * with automatic metadata generation including correlation IDs and timestamps.
 */
export const defineEvent = event.builder({
  validator: ZodValidator,
  metadata() {
    return {
      timestamp: new Date().toISOString(),
      source: "argus",
      version: "1.0",
      correlationId: crypto.randomUUID(),
    };
  },
});