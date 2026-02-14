import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { config } from './config';
import { login } from './controllers/auth.controller';
import { ragChat } from './controllers/chat.controller';
import {
   deleteDocument,
   listDocuments,
   reindexDocument,
   uploadDocument,
} from './controllers/document.controller';
import {
   health,
   healthOllama,
   settings,
} from './controllers/system.controller';
import {
   getProviders,
   healthProvider,
   updateMyProviders,
   updateProviders,
} from './controllers/providers.controller';
import { requireAdmin, requireAuth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';

const app = express();
const upload = multer({
   dest: path.join(config.dataDir, 'tmp'),
   limits: { fileSize: config.uploadMaxSizeMb * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

app.get('/api/health', health);
app.get('/api/health/ollama', healthOllama);
app.get('/api/health/provider', healthProvider);
app.post('/api/auth/login', login);

app.get('/api/settings', requireAuth, settings);
app.get('/api/providers', requireAuth, getProviders);
app.put('/api/providers', requireAuth, requireAdmin, updateProviders);
app.put('/api/providers/me', requireAuth, updateMyProviders);
app.get('/api/documents', requireAuth, listDocuments);
app.post(
   '/api/documents/upload',
   requireAuth,
   requireAdmin,
   upload.single('file'),
   uploadDocument
);
app.post(
   '/api/documents/:id/reindex',
   requireAuth,
   requireAdmin,
   reindexDocument
);
app.delete('/api/documents/:id', requireAuth, requireAdmin, deleteDocument);

app.post('/api/chat', requireAuth, rateLimit, ragChat);

export default app;
