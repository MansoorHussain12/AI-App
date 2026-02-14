import type { Response } from 'express';
import { prisma } from '../../prisma/PrismaClient';
import type { AuthRequest } from '../middleware/auth';
import { healthCheckProvider } from '../services/model-gateway.service';
import {
   getEffectiveProvider,
   getProviderConfig,
   maskToken,
   type ProviderKind,
} from '../services/provider-config.service';

function parseProvider(value: unknown): ProviderKind | null | undefined {
   if (value === undefined) return undefined;
   if (value === null) return null;
   if (value === 'OLLAMA' || value === 'HF_REMOTE') return value;
   throw new Error('Invalid provider value');
}

export async function healthProvider(req: AuthRequest, res: Response) {
   const deep = req.query.deep === 'true';
   const data = await healthCheckProvider(deep);
   res.json(data);
}

export async function getProviders(req: AuthRequest, res: Response) {
   if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
   const [config, effective] = await Promise.all([
      getProviderConfig(),
      getEffectiveProvider(req.user.userId),
   ]);

   if (req.user.role === 'ADMIN') {
      return res.json({
         ...config,
         hfApiToken: config.hfApiToken ? maskToken(config.hfApiToken) : null,
         effective,
      });
   }

   return res.json({
      llmProvider: effective.llmProvider,
      embedProvider: effective.embedProvider,
      allowRemoteHf: config.allowRemoteHf,
      allowRemoteHfContext: config.allowRemoteHfContext,
   });
}

export async function updateProviders(req: AuthRequest, res: Response) {
   if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
   }

   try {
      const defaultLlmProvider = parseProvider(req.body.defaultLlmProvider);
      const defaultEmbedProvider = parseProvider(req.body.defaultEmbedProvider);
      const allowRemoteHf =
         typeof req.body.allowRemoteHf === 'boolean'
            ? req.body.allowRemoteHf
            : undefined;
      const allowRemoteHfContext =
         typeof req.body.allowRemoteHfContext === 'boolean'
            ? req.body.allowRemoteHfContext
            : undefined;
      const hfApiToken =
         typeof req.body.hfApiToken === 'string'
            ? req.body.hfApiToken
            : undefined;
      const hfChatModel =
         typeof req.body.hfChatModel === 'string'
            ? req.body.hfChatModel
            : req.body.hfChatModel === null
              ? null
              : undefined;
      const hfEmbedModel =
         typeof req.body.hfEmbedModel === 'string'
            ? req.body.hfEmbedModel
            : req.body.hfEmbedModel === null
              ? null
              : undefined;

      const current = await getProviderConfig();
      const nextAllowRemote = allowRemoteHf ?? current.allowRemoteHf;
      const nextLlm = defaultLlmProvider ?? current.defaultLlmProvider;
      const nextEmbed = defaultEmbedProvider ?? current.defaultEmbedProvider;
      const nextToken = hfApiToken ?? current.hfApiToken;
      const nextChatModel = hfChatModel ?? current.hfChatModel;

      if (
         !nextAllowRemote &&
         (nextLlm === 'HF_REMOTE' || nextEmbed === 'HF_REMOTE')
      ) {
         return res
            .status(400)
            .json({
               error: 'HF_REMOTE cannot be selected when allowRemoteHf=false',
            });
      }
      if (
         nextAllowRemote &&
         (nextLlm === 'HF_REMOTE' || nextEmbed === 'HF_REMOTE')
      ) {
         if (!nextToken || !nextChatModel) {
            return res
               .status(400)
               .json({
                  error: 'HF token and hfChatModel are required for HF_REMOTE',
               });
         }
      }

      const updated = await prisma.providerConfig.update({
         where: { id: 'singleton' },
         data: {
            defaultLlmProvider: nextLlm,
            defaultEmbedProvider: nextEmbed,
            allowRemoteHf: nextAllowRemote,
            allowRemoteHfContext,
            hfApiToken,
            hfChatModel,
            hfEmbedModel,
         },
      });

      return res.json({
         ...updated,
         hfApiToken: updated.hfApiToken ? maskToken(updated.hfApiToken) : null,
      });
   } catch (error) {
      return res
         .status(400)
         .json({
            error: error instanceof Error ? error.message : 'Invalid payload',
         });
   }
}

export async function updateMyProviders(req: AuthRequest, res: Response) {
   if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

   try {
      const llmProvider = parseProvider(req.body.llmProvider);
      const embedProvider = parseProvider(req.body.embedProvider);
      const config = await getProviderConfig();

      if (
         !config.allowRemoteHf &&
         (llmProvider === 'HF_REMOTE' || embedProvider === 'HF_REMOTE')
      ) {
         return res
            .status(400)
            .json({ error: 'HF_REMOTE is disabled by admin' });
      }

      const updated = await prisma.userProviderPreference.upsert({
         where: { userId: req.user.userId },
         create: {
            userId: req.user.userId,
            llmProvider: llmProvider ?? null,
            embedProvider: embedProvider ?? null,
         },
         update: {
            llmProvider: llmProvider ?? null,
            embedProvider: embedProvider ?? null,
         },
      });

      return res.json(updated);
   } catch (error) {
      return res
         .status(400)
         .json({
            error: error instanceof Error ? error.message : 'Invalid payload',
         });
   }
}
