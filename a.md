
# Arquitectura del sistema

### **1. Capa de Ingesta de Datos**
- **Lambdas de Scraping**
  - Programadas mediante **EventBridge** (cron-job).
  - Obtienen artículos vía RSS, sitemaps o APIs.
  - Genera una lista con las urls de los articulos nuevos para cada medio
  - Actualiza siteTracking table usando la noticia mas reciente de cada medio
  * Publica un evento (`NewArticlesQueue`) con las noticias nuevas (un evento por medio)

### **2. Pipeline de Procesamiento (Basado en Eventos)**
- **Lambda de Procesamiento de Artículos**
  - Se activa por la `NewArticlesQueue`.
  * Mira de que medio son los articulos nuevos y utiliza el articleParser correspondiente para scrappear los datos de cada url
  - Almacena los articulos en la base de datos 
  - Publica un evento en **EventBridge** (`ArticleProcessedEvent`).

- **Lambda de Generación de Embeddings**
  - Suscrita a `ArticleProcessedEvent`.
  - Genera embeddings semánticos (usando OpenAI API, HuggingFace o similar).
  - Almacena los embeddings en **Pineconde**. 
  - Publica un evento en **EventBridge** (`EmbeddingGeneratedEvent`).

- **Clustering**
  - Se activa periódicamente (por ejemplo, 4 veces al dia) o por `EmbeddingGeneratedEvent`.
  - Utiliza **BERTopic, hdbscan** o similar para clustering, segmentando por franjas de tiempo, puede ser una semana (No hace sentido tener en un mismo cluster noticias publicadas en fechas muy distantes).
  * Actualizar/Crear una representacion de estos clusters en la base de datos
  - Publica un evento en **EventBridge** (`ClusterUpdatedEvent`).

### **3. Comparación de Artículos y Generación de Diffs**
- **Lambda de Comparación** 
  - Se activa por `ClusterUpdatedEvent` o bajo demanda vía API.
  - Utiliza LLM (OpenAI, Cohere, etc.) para generar "diffs" y resúmenes de artículos de un cluster.
  * Almacena los datos en la base de datos

### **4. Capa de API**
- **Hono + Lambda**
  - Expone endpoints REST para la extensión de Chrome .
  - Maneja consultas de artículos, clusters y diffs.
  - Autenticación y rate limiting.

### **5. Extensión de Chrome**
- Se comunica con la API para obtener artículos similares y diffs de la página actual.

### **6. Monitoreo y Observabilidad**
- **Sentry** o similar para el seguimiento de errores en Lambdas y la extensión.
- **Posthog**  para analiticas de producto
