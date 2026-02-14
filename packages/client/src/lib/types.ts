export type User = { username: string; role: 'ADMIN' | 'USER' };

export type DocumentItem = {
   id: string;
   title: string;
   status: 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED' | string;
   sourceType: string;
   ingestionJobs: { progress: number; stage: string; status: string }[];
};

export type Citation = {
   chunkId: string;
   title: string;
   pageOrSlide: string;
   snippet: string;
   docId?: string;
   score?: number;
};

export type ProviderKind = 'OLLAMA' | 'HF_REMOTE';

export type ProviderConfigResponse = {
   allowRemoteHf: boolean;
   allowRemoteHfContext?: boolean;
   defaultLlmProvider?: ProviderKind;
   defaultEmbedProvider?: ProviderKind;
   llmProvider?: ProviderKind;
   embedProvider?: ProviderKind;
   hfChatModel?: string | null;
   hfEmbedModel?: string | null;
   hfApiToken?: string | null;
   effective?: {
      llmProvider: ProviderKind;
      embedProvider: ProviderKind;
   };
};

export type SettingsState = Record<string, string | number | boolean | null>;

export type ChatResponse = {
   answer: string;
   citations: Citation[];
   sessionId?: string;
};

export type HealthResponse = {
   ok: boolean;
   error?: string;
   llmProvider?: ProviderKind;
   embedProvider?: ProviderKind;
   allowRemoteHf?: boolean;
   allowRemoteHfContext?: boolean;
   provider?: Record<string, unknown>;
};
