import { allSecrets } from "./secrets";

export const eventBus = new sst.aws.Bus("ArgusEventBus");

// Subscribe to handle all events with a single fat lambda
eventBus.subscribe("EventHandler", {
  handler: "apps/functions/src/event/index.handler",
  link: [...allSecrets, eventBus],
  nodejs: {
    install: ["@libsql/linux-x64-gnu"],
  },
});
