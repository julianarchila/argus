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
    await import("./infra/secrets")
    await import("./infra/events")
    await import("./infra/cron")

    new sst.x.DevCommand("LocalTurso", {
      dev: {
        command: "turso dev --db-file local.db",
        autostart: true
      }
    })

  },
});
