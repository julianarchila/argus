import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
import { Article } from '../packages/core/src/parsers';

export type GenerateEmbeddingsOptions = {
  article: Article;
  id: string; // ahora sí se usa acá también si quieres ligarlo
};

export type SaveEmbeddingsOptions = {
  url: string;
  embedding: number[];
  id: string;
};

// Verificación obligatoria de API key
if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is required');
}

// Inicializar Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = 'article-embeddings';
let index: ReturnType<typeof pinecone.index>;

// Crear índice si no existe
async function setupIndex() {
  const indexes = await pinecone.listIndexes();
  if (!indexes.includes(indexName)) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 1536,
      metric: 'cosine',
    });
  }
  index = pinecone.index(indexName);
}
await setupIndex();

// Generar embeddings con OpenAI
export async function generateArticleEmbeddings(
  options: GenerateEmbeddingsOptions
): Promise<number[]> {
  const embeddingModel = openai.embedding('text-embedding-ada-002');
  const input = options.article.text.replaceAll('\n', ' ');
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  if (embedding.length !== 1536) {
    throw new Error('Generated embedding does not have expected length of 1536');
  }

  return embedding;
}

// Guardar embeddings en Pinecone
export async function saveArticleEmbeddings(
  options: SaveEmbeddingsOptions
): Promise<void> {
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
    console.error('Error saving embedding:', error);
    throw error;
  }
}