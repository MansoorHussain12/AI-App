import ollama from 'ollama';
import { config } from '../config';
import { getProviderConfig } from './provider-config.service';
import { qdrantHealth } from './rag/qdrant.service';

export type ChatMessage = {
   role: 'system' | 'user' | 'assistant';
   content: string;
};

ollama.host = config.ollamaHost;

async function hfRequest(
   url: string,
   token: string,
   payload: unknown,
   timeout = config.hfTimeoutMs,
   retries = 1
) {
   let lastError: unknown;
   for (let i = 0; i <= retries; i += 1) {
      try {
         const ctrl = new AbortController();
         const timer = setTimeout(() => ctrl.abort(), timeout);
         const response = await fetch(url, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
         });
         clearTimeout(timer);
         if (!response.ok) {
            throw new Error(
               `HF request failed ${response.status}: ${await response.text()}`
            );
         }
         return response.json();
      } catch (error) {
         lastError = error;
         if (i < retries)
            await new Promise((resolve) => setTimeout(resolve, 300));
      }
   }
   throw lastError;
}

export async function embedWithProvider(
   text: string,
   provider: 'OLLAMA' | 'HF_REMOTE'
) {
   if (provider === 'OLLAMA') {
      const response = await ollama.embeddings({
         model: config.ollamaEmbedModel,
         prompt: text,
      });
      return response.embedding;
   }

   const providerConfig = await getProviderConfig();
   if (!providerConfig.allowRemoteHf || !providerConfig.hfApiToken) {
      throw new Error('HF remote embeddings are disabled');
   }
   if (!providerConfig.hfEmbedModel) {
      const response = await ollama.embeddings({
         model: config.ollamaEmbedModel,
         prompt: text,
      });
      return response.embedding;
   }

   const endpoint = providerConfig.hfEmbedModel.startsWith('http')
      ? providerConfig.hfEmbedModel
      : `${config.hfEmbedEndpoint}/${providerConfig.hfEmbedModel}`;
   const data = (await hfRequest(endpoint, providerConfig.hfApiToken, {
      inputs: text,
   })) as number[] | number[][];

   if (Array.isArray(data[0])) return data[0] as number[];
   return data as number[];
}

export async function chatWithProvider(
   messages: ChatMessage[],
   provider: 'OLLAMA' | 'HF_REMOTE'
) {
   if (provider === 'OLLAMA') {
      const response = await ollama.chat({
         model: config.ollamaChatModel,
         messages,
         stream: false,
      });
      return response.message.content;
   }

   const providerConfig = await getProviderConfig();
   if (!providerConfig.allowRemoteHf || !providerConfig.hfApiToken) {
      throw new Error('HF remote chat is disabled');
   }
   if (!providerConfig.hfChatModel) {
      throw new Error('HF chat model is required');
   }

   const endpoint = providerConfig.hfChatModel.startsWith('http')
      ? providerConfig.hfChatModel
      : `${config.hfChatEndpoint}/${providerConfig.hfChatModel}`;

   const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
   const data = (await hfRequest(endpoint, providerConfig.hfApiToken, {
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.2 },
   })) as { generated_text?: string }[] | { generated_text?: string };

   if (Array.isArray(data)) return data[0]?.generated_text ?? '';
   return data.generated_text ?? '';
}

export async function healthCheckOllama() {
   const response = await ollama.chat({
      model: config.ollamaChatModel,
      messages: [{ role: 'user', content: 'Respond OK' }],
      stream: false,
   });
   return response.message.content;
}

export async function healthCheckProvider(deep = false) {
   const providerConfig = await getProviderConfig();
   const ollamaInfo = {
      ok: true,
      host: config.ollamaHost,
      chatModel: config.ollamaChatModel,
      embedModel: config.ollamaEmbedModel,
   };
   try {
      await healthCheckOllama();
   } catch {
      ollamaInfo.ok = false;
   }

   const qdrant = await qdrantHealth();

   const payload: Record<string, unknown> = {
      ok: ollamaInfo.ok && qdrant.ok,
      llmProvider: providerConfig.defaultLlmProvider,
      embedProvider: providerConfig.defaultEmbedProvider,
      allowRemoteHf: providerConfig.allowRemoteHf,
      allowRemoteHfContext: providerConfig.allowRemoteHfContext,
      ollama: ollamaInfo,
      qdrant,
   };

   if (
      providerConfig.defaultLlmProvider === 'HF_REMOTE' ||
      providerConfig.defaultEmbedProvider === 'HF_REMOTE'
   ) {
      let hfOk =
         providerConfig.allowRemoteHf && Boolean(providerConfig.hfApiToken);
      if (deep && hfOk && providerConfig.hfChatModel) {
         try {
            await chatWithProvider(
               [{ role: 'user', content: 'hello' }],
               'HF_REMOTE'
            );
         } catch {
            hfOk = false;
         }
      }
      payload.huggingface = {
         ok: hfOk,
         mode: 'remote',
         chatModel: providerConfig.hfChatModel,
         embedModel: providerConfig.hfEmbedModel,
      };
      payload.ok = Boolean(payload.ok) && hfOk;
   }

   return payload;
}
