import { drizzle as drizzle_libsql } from "drizzle-orm/libsql/web"
import { Resource } from "sst"

const dbCredentials = Resource.DBToken.value == "LOCAL" ? {
  url: Resource.DBUrl.value
} : {
  url: Resource.DBUrl.value,
  authToken: Resource.DBToken.value,
}

let db: ReturnType<typeof createClient> | undefined

const createClient = () => {
  return drizzle_libsql({
    connection: {
      ...dbCredentials
    },
  })
}

export const getDb = () => {
  if (!db) {
    console.log("No existing db, creating new one")
    db = createClient()
  }
  return db
}

