import type { Request, Response } from 'express';
import { config } from '../config';
import { healthCheckOllama } from '../services/ollama.service';

export function health(_req: Request, res: Response) {
   res.json({ ok: true, offline: true });
}

export async function healthOllama(_req: Request, res: Response) {
   try {
      await healthCheckOllama();
      res.json({ ok: true });
   } catch (error) {
      res.status(503).json({
         ok: false,
         error: error instanceof Error ? error.message : 'Unknown error',
      });
   }
}

export function settings(_req: Request, res: Response) {
   res.json({
      ollamaHost: config.ollamaHost,
      chatModel: config.ollamaChatModel,
      embedModel: config.ollamaEmbedModel,
      chunkSize: config.chunkSize,
      topK: config.topK,
   });
}
