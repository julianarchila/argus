/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "argus",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: input.stage === "production" ? "prod" : "dev",
        },
      },

    };
  },
  async run() {
    const secrets = await import("./infra/secrets")
    const events = await import("./infra/events")

    new sst.aws.Cron("FeedCron", {
      // function: "apps/functions/src/feed-cron/index.handler",
      function: {
        handler: "apps/functions/src/feed-cron/index.handler",
        link: [...secrets.allSecrets, events.eventBus],
        nodejs: {
          install: ['@libsql/linux-x64-gnu']
        }
      },
      schedule: "rate(1 minute)",
    })

    // Creating subscribers for each event type
    events.eventBus.subscribe("ArticleProcessor",
      // "apps/functions/src/article-processor/index.handler"
      {
        handler: "apps/functions/src/article-processor/index.handler",
        link: [...secrets.allSecrets, events.eventBus],
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

  },
});
