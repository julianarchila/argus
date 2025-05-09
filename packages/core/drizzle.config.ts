import { defineConfig } from "drizzle-kit"
import { Resource } from "sst"

const dbCredentials = Resource.DBToken.value == "LOCAL" ? {
  url: Resource.DBUrl.value
} : {
  url: Resource.DBUrl.value,
  authToken: Resource.DBToken.value,
}

export default defineConfig({
  out: "./migrations",
  schema: "./src/database/schema.sql.ts",
  dialect: "turso",
  dbCredentials: dbCredentials
})

