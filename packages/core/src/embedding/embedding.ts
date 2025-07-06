import { Resource } from "sst";
import { embed } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { Article } from "../parsers/types";

export type GenerateEmbeddingsOptions = {
  article: Article;
  id: string;
};

export type SaveEmbeddingsOptions = {
  url: string;
  embedding: number[];
  id: string;
};

// ✅ Verificación obligatoria de API keys usando SST Resources
if (!Resource.OpenAIKey.value) {
  throw new Error("OpenAIKey is required");
}
if (!Resource.PineconeApiKey.value) {
  throw new Error("PineconeApiKey is required");
}

// ✅ Inicializar clientes con las claves desde SST Resources
const pinecone = new Pinecone({ apiKey: Resource.PineconeApiKey.value });
const openai = createOpenAI({
  apiKey: Resource.OpenAIKey.value,
});
const indexName = "article-embeddings";
let index: ReturnType<typeof pinecone.index>;

/**
 * Llamar antes de guardar o consultar embeddings.
 */
export async function initEmbeddings(): Promise<void> {
  await setupIndex();
}

/**
 * Crear índice en Pinecone si no existe.
 */
async function setupIndex() {
  try {
    const response = await pinecone.listIndexes();
    const existingNames = response.indexes?.map((idx) => idx.name) ?? [];

    if (!existingNames.includes(indexName)) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
        waitUntilReady: true,
      });
    }

    index = pinecone.index(indexName);
  } catch (error) {
    console.error("Error setting up Pinecone index:", error);
    throw new Error("Failed to initialize Pinecone index");
  }
}

/**
 * Genera un embedding para el texto de un artículo.
 */
export async function generateArticleEmbeddings(
  options: GenerateEmbeddingsOptions
): Promise<number[]> {
  const input = options.article.text.replace(/\n/g, " ");

  // ✅ Configurar el modelo de embedding con la API key
  const embeddingModel = openai.embedding("text-embedding-ada-002");

  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  if (embedding.length !== 1536) {
    throw new Error(
      "Generated embedding does not have expected length of 1536"
    );
  }

  return embedding;
}

/**
 * Guarda un embedding en Pinecone.
 */
export async function saveArticleEmbeddings(
  options: SaveEmbeddingsOptions
): Promise<void> {
  if (!index) {
    throw new Error(
      "Pinecone index not initialised. Call initEmbeddings() first."
    );
  }

  try {
    const record: PineconeRecord = {
      id: options.id,
      values: options.embedding,
      metadata: {
        url: options.url,
        id: options.id,
      },
    };

    await index.upsert([record]);
  } catch (error) {
    console.error("Error saving embedding:", error);
    throw error;
  }
}




