# Offline Factory RAG Assistant (MVP)

On-prem, offline-first TypeScript monorepo for factory document Q&A with pluggable providers.

## Features
- Upload + index PDF, DOCX, PPT/PPTX.
- DB-backed ingestion queue with status tracking.
- RAG chat with citations (document + page/slide + snippet).
- Confidence gating and evidence-first responses.
- Local auth (`ADMIN` / `USER`) and audit logs.
- Health checks: `/api/health`, `/api/health/ollama`, `/api/health/provider`.
- Persisted provider switching:
  - system default (admin)
  - optional per-user preference override

## Provider modes
- **Default (offline-safe):** Ollama for chat + embeddings.
- **Optional online mode:** Hugging Face remote (strictly gated).

Hugging Face remote calls are blocked unless admin explicitly enables them via provider settings (`allowRemoteHf=true`) and stores a token/model.

## Configuration
Copy `.env.example` to `.env`.

## Run
```bash
bun install
cd packages/server && bunx prisma generate && bunx prisma migrate dev --name init
cd /workspace/AI-App && bun run dev
```

- Server: `http://localhost:3000`
- Client: `http://localhost:5173`

## API docs
See `docs/api-surface.md` for current endpoints and payload surface.

## Data location and backup
- Files + SQLite DB are under `./data`.
- Backup/restore by copying the entire `data/` directory.
