import { prisma } from '../../prisma/PrismaClient';

export type ProviderKind = 'OLLAMA' | 'HF_REMOTE';

export async function ensureProviderConfig() {
   return prisma.providerConfig.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
   });
}

export async function getProviderConfig() {
   return ensureProviderConfig();
}

export async function getEffectiveProvider(userId: string) {
   const [config, pref] = await Promise.all([
      getProviderConfig(),
      prisma.userProviderPreference.findUnique({ where: { userId } }),
   ]);

   return {
      llmProvider: pref?.llmProvider ?? config.defaultLlmProvider,
      embedProvider: pref?.embedProvider ?? config.defaultEmbedProvider,
      config,
      preference: pref,
   };
}

export function maskToken(token: string | null) {
   if (!token) return null;
   if (token.length <= 8) return '****';
   return `${token.slice(0, 4)}****${token.slice(-2)}`;
}
