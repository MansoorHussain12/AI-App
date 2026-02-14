import axios from 'axios';
import type {
   ChatResponse,
   DocumentItem,
   HealthResponse,
   ProviderConfigResponse,
   SettingsState,
   User,
} from './types';

export const API_BASE_URL =
   import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
   baseURL: API_BASE_URL,
});

export function setAuthToken(token: string) {
   api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : '';
}

export async function login(username: string, password: string) {
   const { data } = await api.post<{ token: string; user: User }>(
      '/api/auth/login',
      {
         username,
         password,
      }
   );
   return data;
}

export async function getDocuments() {
   const { data } = await api.get<DocumentItem[]>('/api/documents');
   return data;
}

export async function uploadDocument(file: File) {
   const fd = new FormData();
   fd.append('file', file);
   const { data } = await api.post<{ documentId: string }>(
      '/api/documents/upload',
      fd
   );
   return data;
}

export async function reindexDocument(id: string) {
   const { data } = await api.post<{ ok: boolean }>(
      `/api/documents/${id}/reindex`
   );
   return data;
}

export async function deleteDocument(id: string) {
   const { data } = await api.delete<{ ok: boolean }>(`/api/documents/${id}`);
   return data;
}

export async function chat(params: { question: string; docIds?: string[] }) {
   const { data } = await api.post<ChatResponse>('/api/chat', params);
   return data;
}

export async function getSettings() {
   const { data } = await api.get<SettingsState>('/api/settings');
   return data;
}

export async function getProviders() {
   const { data } = await api.get<ProviderConfigResponse>('/api/providers');
   return data;
}

export async function updateProviders(payload: Record<string, unknown>) {
   const { data } = await api.put<ProviderConfigResponse>(
      '/api/providers',
      payload
   );
   return data;
}

export async function updateMyProviders(payload: Record<string, unknown>) {
   const { data } = await api.put<ProviderConfigResponse>(
      '/api/providers/me',
      payload
   );
   return data;
}

export async function healthOllama() {
   const { data } = await api.get<HealthResponse>('/api/health/ollama');
   return data;
}

export async function healthProvider() {
   const { data } = await api.get<HealthResponse>('/api/health/provider');
   return data;
}
