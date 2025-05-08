import { drizzle as drizzle_libsql } from "drizzle-orm/libsql/web"
import { Resource } from "sst"

let db: ReturnType<typeof createClient> | undefined

const createClient = () => {
  return drizzle_libsql({
    connection: {
      url: Resource.DBUrl.value,
      authToken: Resource.DBToken.value,
    },
  })
}

export const getDb = () => {
  if (!db) {
    console.log("No existing db, creating new one")
    db = createClient()
  }
  console.log("Returning existing db")
  return db
}

