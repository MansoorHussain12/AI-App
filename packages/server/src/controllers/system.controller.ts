import type { Request, Response } from 'express';
import { config } from '../config';
import { healthCheckOllama } from '../services/model-gateway.service';
import {
   getProviderConfig,
   maskToken,
} from '../services/provider-config.service';

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

export async function settings(_req: Request, res: Response) {
   const provider = await getProviderConfig();
   res.json({
      ollamaHost: config.ollamaHost,
      chatModel: config.ollamaChatModel,
      embedModel: config.ollamaEmbedModel,
      chunkSize: config.chunkSize,
      topK: config.topK,
      defaultLlmProvider: provider.defaultLlmProvider,
      defaultEmbedProvider: provider.defaultEmbedProvider,
      allowRemoteHf: provider.allowRemoteHf,
      allowRemoteHfContext: provider.allowRemoteHfContext,
      hfChatModel: provider.hfChatModel,
      hfEmbedModel: provider.hfEmbedModel,
      hfApiTokenMasked: maskToken(provider.hfApiToken),
   });
}
