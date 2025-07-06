export const secret = {
  DBUrl: new sst.Secret(
    "DBUrl",
    "http://127.0.0.1:8080"
  ),
  DBToken: new sst.Secret(
    "DBToken",
    "LOCAL"
  ),
  PineconeApiKey: new sst.Secret(
    "PineconeApiKey"
  ),
  OpenAIKey: new sst.Secret(
    "OpenAIKey"
  ),
}

export const allSecrets = Object.values(secret)