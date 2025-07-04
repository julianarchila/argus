# SST AWS Bus Documentation

A comprehensive guide to using SST's AWS Bus utilities for event-driven architecture.

## Core Utilities

### 1. Bus Infrastructure (`sst.aws.Bus`)

Creates an AWS EventBridge-based message bus:

```typescript
// infra/bus.ts
export const bus = new sst.aws.Bus("MyBus");

// Subscribe to events
bus.subscribe("EventHandler", {
  handler: "./src/handlers/events.handler",
  link: [database, secrets],
  timeout: "5 minutes",
  permissions: [
    {
      actions: ["ses:SendEmail"],
      resources: ["*"],
    },
  ],
});
```

**Configuration Options:**

- `handler`: Path to your event handler function
- `link`: Resources to link (databases, secrets, etc.)
- `timeout`: Handler execution timeout
- `permissions`: IAM permissions for the handler
- `environment`: Environment variables

### 2. Event Publishing (`bus.publish`)

Publish events to the bus:

```typescript
import { bus } from "sst/aws/bus";
import { Resource } from "sst";

// Publish an event
await bus.publish(
  Resource.MyBus, // Bus resource
  MyEvent, // Event definition
  { id: "123" }, // Event payload
);
```

### 3. Event Definition (`sst/event`)

Define typed events with validation:

```typescript
import { event } from "sst/event";
import { ZodValidator } from "sst/event/validator";
import { z } from "zod";

// Create event builder
const defineEvent = event.builder({
  validator: ZodValidator,
  metadata() {
    return {
      timestamp: Date.now(),
      version: "1.0",
    };
  },
});

// Define specific events
export const UserCreated = defineEvent(
  "user.created",
  z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
);

export const OrderCompleted = defineEvent(
  "order.completed",
  z.object({
    orderId: z.string(),
    userId: z.string(),
    total: z.number(),
  }),
);
```

### 4. Event Handling (`bus.subscriber`)

Handle events with type safety:

```typescript
import { bus } from "sst/aws/bus";

export const handler = bus.subscriber(
  [UserCreated, OrderCompleted],
  async (event) => {
    console.log("Event received:", event.type);
    console.log("Payload:", event.properties);
    console.log("Metadata:", event.metadata);

    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.properties);
        break;
      case "order.completed":
        await handleOrderCompleted(event.properties);
        break;
    }
  },
);
```

## Basic Usage Patterns

### 1. Simple Event System

```typescript
// 1. Define events
const TaskCreated = defineEvent(
  "task.created",
  z.object({
    taskId: z.string(),
    title: z.string(),
  }),
);

// 2. Set up infrastructure
const bus = new sst.aws.Bus("TaskBus");
bus.subscribe("TaskHandler", {
  handler: "./handlers/tasks.handler",
});

// 3. Publish events
await bus.publish(Resource.TaskBus, TaskCreated, {
  taskId: "task-123",
  title: "Complete documentation",
});

// 4. Handle events
export const handler = bus.subscriber([TaskCreated], async (event) => {
  if (event.type === "task.created") {
    await sendTaskNotification(event.properties.taskId);
  }
});
```

### 2. Multiple Event Types

```typescript
// Define multiple related events
const Events = {
  UserRegistered: defineEvent(
    "user.registered",
    z.object({ userId: z.string() }),
  ),
  EmailVerified: defineEvent(
    "user.email_verified",
    z.object({ userId: z.string() }),
  ),
  ProfileUpdated: defineEvent(
    "user.profile_updated",
    z.object({ userId: z.string() }),
  ),
};

// Handle all user events
export const handler = bus.subscriber(Object.values(Events), async (event) => {
  switch (event.type) {
    case "user.registered":
      await sendWelcomeEmail(event.properties.userId);
      break;
    case "user.email_verified":
      await activateAccount(event.properties.userId);
      break;
    case "user.profile_updated":
      await syncToAnalytics(event.properties.userId);
      break;
  }
});
```

### 3. Event Composition

```typescript
// Events can trigger other events
export const handler = bus.subscriber([OrderCreated], async (event) => {
  if (event.type === "order.created") {
    const { orderId } = event.properties;

    // Process order
    await processPayment(orderId);

    // Trigger follow-up events
    await bus.publish(Resource.OrderBus, InventoryUpdated, {
      orderId,
      action: "reserved",
    });

    await bus.publish(Resource.OrderBus, NotificationSent, {
      type: "order_confirmation",
      orderId,
    });
  }
});
```

## Advanced Patterns

### 1. Event Metadata

Include consistent metadata across all events:

```typescript
const defineEvent = event.builder({
  validator: ZodValidator,
  metadata() {
    return {
      timestamp: new Date().toISOString(),
      source: "api",
      version: "1.0",
      correlationId: crypto.randomUUID(),
    };
  },
});
```

### 2. Error Handling

```typescript
export const handler = bus.subscriber([MyEvent], async (event) => {
  try {
    await processEvent(event);
  } catch (error) {
    console.error("Event processing failed:", {
      eventType: event.type,
      eventId: event.metadata.correlationId,
      error: error.message,
    });

    // Optionally publish failure event
    await bus.publish(Resource.ErrorBus, EventFailed, {
      originalEventType: event.type,
      error: error.message,
    });

    throw error; // Re-throw to trigger retry
  }
});
```

### 3. Conditional Publishing

```typescript
// Only publish events when conditions are met
async function updateUserProfile(userId: string, changes: any) {
  const previousProfile = await getUserProfile(userId);
  await saveProfileChanges(userId, changes);

  // Only publish if email changed
  if (changes.email && changes.email !== previousProfile.email) {
    await bus.publish(Resource.UserBus, EmailChanged, {
      userId,
      oldEmail: previousProfile.email,
      newEmail: changes.email,
    });
  }
}
```

### 4. Event Filtering

```typescript
// Create specialized handlers for specific scenarios
export const criticalOrderHandler = bus.subscriber(
  [OrderCreated],
  async (event) => {
    if (event.type === "order.created") {
      const order = await getOrder(event.properties.orderId);

      // Only handle high-value orders
      if (order.total > 1000) {
        await notifyManagement(order);
        await requireApproval(order);
      }
    }
  },
);
```

## Testing Events

### 1. Mock Bus Publishing

```typescript
// Test that events are published
const mockBus = {
  publish: jest.fn(),
};

test("publishes user created event", async () => {
  await createUser({ email: "test@example.com" });

  expect(mockBus.publish).toHaveBeenCalledWith(
    Resource.UserBus,
    UserCreated,
    expect.objectContaining({
      email: "test@example.com",
    }),
  );
});
```

### 2. Test Event Handlers

```typescript
test("handles user created event", async () => {
  const event = {
    type: "user.created",
    properties: { userId: "123", email: "test@example.com" },
    metadata: { timestamp: Date.now() },
  };

  await handler(event);

  expect(mockSendWelcomeEmail).toHaveBeenCalledWith("123");
});
```

## Best Practices

### 1. Event Naming

- Use dot notation: `domain.action` (e.g., `user.created`, `order.shipped`)
- Be specific and descriptive
- Use past tense for completed actions

### 2. Payload Design

- Keep payloads minimal - prefer IDs over full objects
- Include only essential data
- Use consistent field naming

### 3. Error Handling

- Always wrap event handlers in try-catch
- Log errors with context
- Decide whether to retry or fail fast

### 4. Performance

- Avoid heavy processing in event handlers
- Use separate queues for different priority levels
- Consider batching for high-volume events

### 5. Schema Evolution

- Version your event schemas
- Handle backward compatibility
- Consider using optional fields for new properties

## Common Gotchas

1. **Async Nature**: Events are processed asynchronously - don't rely on immediate execution
2. **Retry Logic**: Failed events will be retried - ensure handlers are idempotent
3. **Ordering**: Events may not be processed in order - design accordingly
4. **Payload Size**: Keep payloads under AWS EventBridge limits (256KB)
5. **Handler Timeout**: Set appropriate timeouts for your use case

This documentation covers the core SST AWS Bus utilities and patterns for building event-driven applications without requiring specific auth or context management patterns.
