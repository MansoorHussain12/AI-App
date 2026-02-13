import ollama from 'ollama';
import { config } from '../config';

ollama.host = config.ollamaHost;

export async function embed(text: string): Promise<number[]> {
   const response = await ollama.embeddings({
      model: config.ollamaEmbedModel,
      prompt: text,
   });
   return response.embedding;
}

export async function chat(
   messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
) {
   const response = await ollama.chat({
      model: config.ollamaChatModel,
      messages,
      stream: false,
   });
   return response.message.content;
}

export async function healthCheckOllama() {
   await embed('health check');
   await chat([{ role: 'user', content: 'Reply with OK' }]);
}
