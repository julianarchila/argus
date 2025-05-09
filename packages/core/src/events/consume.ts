import { EventSchemas, EventDetailType, EventDetail } from "./schema";

/**
 * Parse and validate an incoming event
 * @param event The raw event object from EventBridge
 * @returns Validated event detail or throws if invalid
 */
export function parseEvent<T extends EventDetailType>(
  event: { detail: string | object; detailType?: string; 'detail-type'?: string }
): EventDetail<T> {
  // Support both camelCase and kebab-case formats from AWS
  const detailTypeValue = event.detailType || event['detail-type'];
  
  // Verify the event detail type is one we know about
  if (!detailTypeValue || !(detailTypeValue in EventSchemas)) {
    throw new Error(`Unknown event type: ${detailTypeValue}`);
  }
  
  // Cast the detail type to our known types
  const detailType = detailTypeValue as T;
  const schema = EventSchemas[detailType];
  
  try {
    // Handle both string and object detail formats
    let parsedDetail: any;
    
    if (typeof event.detail === 'string') {
      // Parse the JSON string
      parsedDetail = JSON.parse(event.detail);
    } else {
      // Already an object
      parsedDetail = event.detail;
    }
    
    return schema.parse(parsedDetail) as EventDetail<T>;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse event: ${error.message}`);
    }
    throw error;
  }
}
