# Offline Factory RAG Assistant (MVP)

On-prem, offline-first TypeScript monorepo for factory document Q&A.

## Core stack
- Express + Prisma + SQLite
- LlamaIndex-style server RAG pipeline
- Qdrant persistent vector store
- Ollama default offline models (`tinyllama`, `nomic-embed-text`)
- Optional Hugging Face remote provider (strictly gated)

## Quickstart
1. Copy `.env.example` to `.env`
2. Start Qdrant:
   ```bash
   docker compose up -d qdrant
   ```
3. Run app:
   ```bash
   bun install
   cd packages/server && bunx prisma generate && bunx prisma migrate dev --name init
   cd /workspace/AI-App && bun run dev
   ```

- Qdrant dashboard: http://localhost:6333/dashboard
- Server: http://localhost:3000
- Client: http://localhost:5173

## Provider switching
- System defaults and user overrides are persisted in DB.
- Offline default is Ollama.
- HF remote can only be used when allowed by admin and token/model are configured.
- Remote context usage in RAG is separately gated by `allowRemoteHfContext`.

## API docs
See `docs/api-surface.md`.

## Additional dev docs
See `docs/dev.md`.
