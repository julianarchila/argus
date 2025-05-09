import { allSecrets } from "./secrets"

export const eventBus = new sst.aws.Bus("ArgusEventBus");

// Creating subscribers for each event type
eventBus.subscribe("ArticleProcessor",
  // "apps/functions/src/article-processor/index.handler"
  {
    handler: "apps/functions/src/article-processor/index.handler",
    link: [...allSecrets, eventBus],
    nodejs: {
      install: ['@libsql/linux-x64-gnu']
    }
  }
  , {
    pattern: {
      source: ["argus.feedcron"],
      detailType: ["NewArticlesEvent"]
    }
  });
