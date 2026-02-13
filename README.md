# Offline Factory RAG Assistant (MVP)

On-prem, offline-first TypeScript monorepo for factory document Q&A using Ollama + local SQLite.

## Features
- Upload + index PDF, DOCX, PPT/PPTX.
- DB-backed ingestion queue with status tracking.
- RAG chat with citations (document + page/slide + snippet).
- Confidence gating: refuses when evidence is weak.
- Local auth (`ADMIN` / `USER`) and audit logs.
- Health checks: `/api/health`, `/api/health/ollama`.

## Prerequisites
- Bun 1.1+
- Node-compatible environment
- Ollama installed locally

## Offline model setup
```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

## Configuration
1. Copy `.env.example` to `.env`.
2. Ensure `DATABASE_URL=file:./data/factory-rag.db` and models are available locally.

## Run
```bash
bun install
cd packages/server && bunx prisma generate && bunx prisma migrate dev --name init
cd /workspace/AI-App && bun run dev
```

- Server: `http://localhost:3000`
- Client: `http://localhost:5173`

## Data location and backup
- Files + SQLite DB are under `./data`.
- Backup/restore by copying the entire `data/` directory.

## Production build
```bash
cd packages/client && bun run build
cd packages/server && bun run start
```
