import { allSecrets } from "./secrets"
import { eventBus } from "./events"

export const feedCron = new sst.aws.Cron("FeedCron", {
  // function: "apps/functions/src/feed-cron/index.handler",
  function: {
    handler: "apps/functions/src/feed-cron/index.handler",
    link: [...allSecrets, eventBus],
    nodejs: {
      install: ['@libsql/linux-x64-gnu']
    }
  },
  schedule: "rate(2 hours)",
})
