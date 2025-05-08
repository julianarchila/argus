import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { Resource } from "sst";
import { BaseEvent, EventDetailType, EventSchemas, EventDetail } from "./schema";

const eb = new EventBridgeClient({});

/**
 * Type-safe event publisher
 * @param detailType The type of event
 * @param source Source identifier of the event
 * @param detail The event payload that will be validated against schema
 * @param busName Optional custom event bus name, defaults to ArgusEventBus
 */
export async function publishEvent<T extends EventDetailType>(
  detailType: T,
  source: string,
  detail: EventDetail<T>,
  busName = Resource.ArgusEventBus.name
): Promise<string> {
  // Get the schema for this event type
  const schema = EventSchemas[detailType];
  
  // Validate the payload against the schema
  const validatedDetail = schema.parse(detail);
  
  // Send the event
  const result = await eb.send(new PutEventsCommand({
    Entries: [{
      EventBusName: busName,
      Source: source,
      DetailType: detailType,
      Detail: JSON.stringify(validatedDetail)
    }]
  }));
  
  if (result.FailedEntryCount && result.FailedEntryCount > 0) {
    throw new Error(`Failed to publish event: ${JSON.stringify(result.Entries)}`);
  }
  
  return result.Entries?.[0]?.EventId || '';
}
