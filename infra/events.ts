import { allSecrets } from "./secrets";

export const eventBus = new sst.aws.Bus("ArgusEventBus");

// Subscribe to handle new articles events
eventBus.subscribe("ArticleProcessor", {
  handler: "apps/functions/src/article-processor/index.handler",
  link: [...allSecrets, eventBus],
  nodejs: {
    install: ["@libsql/linux-x64-gnu"],
  },
});
