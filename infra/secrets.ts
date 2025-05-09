export const secret = {
  DBUrl: new sst.Secret(
    "DBUrl",
    "http://127.0.0.1:8080"
  ),
  DBToken: new sst.Secret(
    "DBToken",
    "LOCAL"
  ),
}

export const allSecrets = Object.values(secret)

