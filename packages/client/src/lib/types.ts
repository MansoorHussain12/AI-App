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
   provider?: Record<string, unknown>;
};
