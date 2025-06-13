import { allSecrets } from "./secrets"
import { eventBus } from "./events"


const feedCronFunction = new sst.aws.Function("feedCronFunction", {
  handler: "apps/functions/src/feed-cron/index.handler",
  link: [...allSecrets, eventBus],
  nodejs: {
    install: ['@libsql/linux-x64-gnu']
  }
})

$dev ? null : new sst.aws.Cron("FeedCron", {
  // function: "apps/functions/src/feed-cron/index.handler",
  function: feedCronFunction.arn,
  schedule: "rate(2 hours)",
})
