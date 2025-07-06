import { initEmbeddings, generateArticleEmbeddings, saveArticleEmbeddings } from "./embedding";
import { Resource } from "sst";

// Verificación de que las API keys estén disponibles
if (!Resource.OpenAIKey.value || !Resource.PineconeApiKey.value) {
  throw new Error("❌ Faltan las API keys de OpenAI o Pinecone. Asegúrate de que estén definidas en SST.");
}

async function main() {
  console.log("🔧 Inicializando índice en Pinecone...");
  await initEmbeddings();

  const dummyArticle = {
    text: `La inteligencia artificial ha transformado la manera en que interactuamos con la tecnología. Este artículo explora cómo los modelos de lenguaje permiten nuevas formas de búsqueda semántica.`,
    url: "https://ejemplo.com/test-article-001",
    markdown: "# Título de prueba\n\nContenido del artículo de prueba.",
    author: "Jane Doe",
    date: new Date("2023-01-01"),
    siteName: "Ejemplo AI Blog",
  };

  console.log("🧠 Generando embedding con OpenAI...");
  const embedding = await generateArticleEmbeddings({
    article: dummyArticle,
    id: "test-article-001",
  });

  console.log("💾 Guardando embedding en Pinecone...");
  await saveArticleEmbeddings({
    url: dummyArticle.url,
    embedding,
    id: "test-article-001",
  });

  console.log("✅ Todo funcionando. Primeros valores del embedding:", embedding.slice(0, 5));
}

main().catch((err) => {
  console.error("❌ Error ejecutando prueba de embeddings:", err);
  process.exit(1);
});