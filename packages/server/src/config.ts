import dotenv from 'dotenv';

dotenv.config();

export const config = {
   port: Number(process.env.PORT ?? 3000),
   jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
   dataDir: process.env.DATA_DIR ?? './data',
   uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 25),
   ollamaHost: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
   ollamaChatModel: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.1:8b',
   ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
   chunkSize: Number(process.env.CHUNK_SIZE_CHARS ?? 4500),
   chunkOverlap: Number(process.env.CHUNK_OVERLAP_CHARS ?? 600),
   topK: Number(process.env.RAG_TOP_K ?? 8),
   minSimilarity: Number(process.env.RAG_MIN_SIMILARITY ?? 0.48),
   rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30),
};
