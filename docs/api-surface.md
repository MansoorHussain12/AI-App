# API Surface

## Auth
- `POST /api/auth/login`
  - body: `{ username, password }`
  - response: `{ token, user }`

## Health
- `GET /api/health`
- `GET /api/health/ollama`
- `GET /api/health/provider?deep=true|false`
  - response: current effective system provider diagnostics, no raw HF token

## Provider Management
- `GET /api/providers` (auth)
  - ADMIN: full provider config with masked token + effective provider
  - USER: effective provider + policy flags
- `PUT /api/providers` (admin)
  - body: `{ defaultLlmProvider, defaultEmbedProvider, allowRemoteHf, allowRemoteHfContext, hfChatModel?, hfEmbedModel?, hfApiToken? }`
- `PUT /api/providers/me` (auth)
  - body: `{ llmProvider?: 'OLLAMA'|'HF_REMOTE'|null, embedProvider?: 'OLLAMA'|'HF_REMOTE'|null }`

## Settings
- `GET /api/settings` (admin)
  - includes ollama settings + provider defaults and policy flags

## Documents
- `GET /api/documents` (auth)
- `POST /api/documents/upload` (admin)
- `POST /api/documents/:id/reindex` (admin)
- `DELETE /api/documents/:id` (admin)

## Chat
- `POST /api/chat` (auth)
  - body: `{ question, sessionId?, docIds? }`
  - response: `{ sessionId, answer, citations, debug }`
