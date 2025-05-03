export const secret = {
  DBUrl: new sst.Secret(
    "DBUrl",
  ),
  DBToken: new sst.Secret(
    "DBToken",
  ),
}

export const allSecrets = Object.values(secret)

