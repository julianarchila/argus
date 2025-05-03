import { defineConfig } from "drizzle-kit"
import { Resource } from "sst"

export default defineConfig({
  out: "./migrations",
  schema: "./src/database/schema.sql.ts",
  dialect: "turso",
  dbCredentials: {
    url: Resource.DBUrl.value,
    authToken: Resource.DBToken.value,
  },
})

