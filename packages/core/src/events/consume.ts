import { EventSchemas, EventDetailType, EventDetail } from "./schema";

/**
 * Parse and validate an incoming event
 * @param event The raw event object from EventBridge
 * @returns Validated event detail or throws if invalid
 */
export function parseEvent<T extends EventDetailType>(
  event: { detail: string; detailType: string }
): EventDetail<T> {
  // Verify the event detail type is one we know about
  if (!(event.detailType in EventSchemas)) {
    throw new Error(`Unknown event type: ${event.detailType}`);
  }
  
  // Cast the detail type to our known types
  const detailType = event.detailType as T;
  const schema = EventSchemas[detailType];
  
  try {
    // Parse the JSON string and validate it
    const parsedDetail = JSON.parse(event.detail);
    return schema.parse(parsedDetail) as EventDetail<T>;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse event: ${error.message}`);
    }
    throw error;
  }
}
