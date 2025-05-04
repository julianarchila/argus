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

    new sst.aws.Cron("FeedCron", {
      // function: "apps/functions/src/feed-cron/index.handler",
      function: {
        handler: "apps/functions/src/feed-cron/index.handler",
        link: [...secrets.allSecrets],
        nodejs: {
          install: ['@libsql/linux-x64-gnu']
        }
      },
      schedule: "rate(1 minute)",
    })

    new sst.aws.Function("TestFunction", {
      handler: "apps/functions/src/test/index.handler",
      url: true
    })
  },
});
