# API Surface

## Auth
- `POST /api/auth/login`
  - body: `{ username, password }`
  - response: `{ token, user }`

## Health
- `GET /api/health`
- `GET /api/health/ollama`
- `GET /api/health/provider?deep=true|false`
  - response includes: `llmProvider`, `embedProvider`, `allowRemoteHf`, `allowRemoteHfContext`, `ollama`, `qdrant`, optional `huggingface`

## Provider Management
- `GET /api/providers` (auth)
  - ADMIN: full provider config with masked token + effective provider
  - USER: effective provider + policy flags
- `PUT /api/providers` (admin)
  - body: `{ defaultLlmProvider, defaultEmbedProvider, allowRemoteHf, allowRemoteHfContext, hfChatModel?, hfEmbedModel?, hfApiToken? }`
- `PUT /api/providers/me` (auth)
  - body: `{ llmProvider?: 'OLLAMA'|'HF_REMOTE'|null, embedProvider?: 'OLLAMA'|'HF_REMOTE'|null }`

## Settings
- `GET /api/settings` (auth)
  - returns runtime tuning + provider defaults/policies (token masked)

## Documents
- `GET /api/documents` (auth)
- `POST /api/documents/upload` (admin)
  - creates DB record and enqueues async ingestion pipeline (EXTRACT → CHUNK → EMBED → UPSERT → DONE)
- `POST /api/documents/:id/reindex` (admin)
- `DELETE /api/documents/:id` (admin)

## Chat
- `POST /api/chat` (auth)
  - body: `{ question, sessionId?, docIds? }`
  - response: `{ sessionId, answer, citations, debug }`
  - behavior: cite-or-refuse with answerability gate and reranked retrieval
