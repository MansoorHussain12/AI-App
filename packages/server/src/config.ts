import dotenv from 'dotenv';

dotenv.config();

const bool = (value: string | undefined, fallback: boolean) => {
   if (value === undefined) return fallback;
   return value.toLowerCase() === 'true';
};

export const config = {
   port: Number(process.env.PORT ?? 3000),
   jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
   dataDir: process.env.DATA_DIR ?? './data',
   uploadMaxSizeMb: Number(process.env.UPLOAD_MAX_SIZE_MB ?? 25),
   ollamaHost: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
   ollamaChatModel: process.env.OLLAMA_CHAT_MODEL ?? 'tinyllama',
   ollamaEmbedModel: process.env.OLLAMA_EMBED_MODEL ?? 'nomic-embed-text',
   hfTimeoutMs: Number(process.env.HF_TIMEOUT_MS ?? 20000),
   hfChatEndpoint:
      process.env.HF_CHAT_ENDPOINT ??
      'https://api-inference.huggingface.co/models',
   hfEmbedEndpoint:
      process.env.HF_EMBED_ENDPOINT ??
      'https://api-inference.huggingface.co/pipeline/feature-extraction',
   qdrantUrl: process.env.QDRANT_URL ?? 'http://localhost:6333',
   qdrantCollection: process.env.QDRANT_COLLECTION ?? 'factory_rag_chunks',
   ragContextMaxChars: Number(process.env.RAG_CONTEXT_MAX_CHARS ?? 16000),
   ragMaxCitations: Number(process.env.RAG_MAX_CITATIONS ?? 6),
   ragMinAnswerability: Number(process.env.RAG_MIN_ANSWERABILITY ?? 0.15),
   chunkSize: Number(process.env.CHUNK_SIZE_CHARS ?? 4500),
   chunkOverlap: Number(process.env.CHUNK_OVERLAP_CHARS ?? 600),
   topK: Number(process.env.RAG_TOP_K ?? 12),
   minSimilarity: Number(process.env.RAG_MIN_SIMILARITY ?? 0.48),
   rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30),
   allowRemoteHfContextEnv: bool(process.env.ALLOW_REMOTE_HF_CONTEXT, false),
};
