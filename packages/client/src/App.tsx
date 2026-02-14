import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
   chat,
   getDocuments,
   getSettings,
   healthOllama,
   healthProvider,
   login,
   setAuthToken,
   uploadDocument,
} from '@/lib/api';
import type { Citation, User } from '@/lib/types';
import { AppShell, type AppTab } from '@/components/layout/AppShell';
import { LoginCard } from '@/components/auth/LoginCard';
import { DocumentsPanel } from '@/components/documents/DocumentsPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

function App() {
   const queryClient = useQueryClient();
   const [token, setToken] = useState(localStorage.getItem('token') ?? '');
   const [user, setUser] = useState<User | null>(null);
   const [activeTab, setActiveTab] = useState<AppTab>('chat');
   const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
   const [question, setQuestion] = useState('');
   const [answer, setAnswer] = useState('');
   const [citations, setCitations] = useState<Citation[]>([]);
   const [loginError, setLoginError] = useState('');

   setAuthToken(token);

   const documentsQuery = useQuery({
      queryKey: ['documents', token],
      queryFn: getDocuments,
      enabled: Boolean(token),
   });

   const settingsQuery = useQuery({
      queryKey: ['settings', token],
      queryFn: getSettings,
      enabled: false,
   });

   const healthQuery = useQuery({
      queryKey: ['health-provider'],
      queryFn: async () => {
         try {
            return await healthProvider();
         } catch {
            return healthOllama();
         }
      },
      retry: false,
      refetchInterval: 30000,
      enabled: Boolean(token),
   });

   const loginMutation = useMutation({
      mutationFn: (payload: { username: string; password: string }) =>
         login(payload.username, payload.password),
      onSuccess: (data) => {
         setToken(data.token);
         setUser(data.user);
         localStorage.setItem('token', data.token);
         setLoginError('');
         toast.success('Logged in successfully');
      },
      onError: (error: AxiosError<{ error?: string }>) => {
         const message = error.response?.data?.error ?? 'Login failed';
         setLoginError(message);
         toast.error(message);
      },
   });

   const uploadMutation = useMutation({
      mutationFn: uploadDocument,
      onSuccess: async () => {
         toast.success('Upload successful');
         await queryClient.invalidateQueries({ queryKey: ['documents'] });
      },
      onError: () => toast.error('Upload failed'),
   });

   const chatMutation = useMutation({
      mutationFn: chat,
      onSuccess: (data) => {
         setAnswer(data.answer);
         setCitations(data.citations);
      },
      onError: () => toast.error('Chat failed'),
   });

   const isAdmin = user?.role === 'ADMIN';

   const providerStatus = healthQuery.data?.ok
      ? 'healthy'
      : healthQuery.isFetching
        ? 'warning'
        : 'error';

   const indexedDocs = useMemo(
      () =>
         (documentsQuery.data ?? []).filter((doc) => doc.status === 'INDEXED'),
      [documentsQuery.data]
   );

   if (!token) {
      return (
         <LoginCard
            loading={loginMutation.isPending}
            error={loginError}
            onSubmit={async (values) => loginMutation.mutateAsync(values)}
         />
      );
   }

   const backendError = documentsQuery.isError
      ? 'Backend not reachable. Check API endpoint in Settings.'
      : '';

   return (
      <AppShell
         activeTab={activeTab}
         setActiveTab={setActiveTab}
         isAdmin={isAdmin}
         providerStatus={providerStatus}
         onLogout={() => {
            localStorage.removeItem('token');
            setToken('');
            setUser(null);
            setAnswer('');
            setCitations([]);
            toast.message('Logged out');
         }}
      >
         <div className="space-y-4">
            {backendError ? (
               <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {backendError}
               </div>
            ) : null}

            {activeTab === 'chat' ? (
               <ChatPanel
                  indexedDocs={indexedDocs}
                  selectedDocs={selectedDocs}
                  onToggleDoc={(id, checked) =>
                     setSelectedDocs((prev) =>
                        checked
                           ? [...prev, id]
                           : prev.filter((docId) => docId !== id)
                     )
                  }
                  question={question}
                  onQuestionChange={setQuestion}
                  onAsk={() =>
                     chatMutation.mutate({
                        question,
                        docIds: selectedDocs.length ? selectedDocs : undefined,
                     })
                  }
                  asking={chatMutation.isPending}
                  answer={answer}
                  citations={citations}
               />
            ) : null}

            {activeTab === 'documents' && isAdmin ? (
               <DocumentsPanel
                  docs={documentsQuery.data ?? []}
                  loading={documentsQuery.isFetching}
                  uploading={uploadMutation.isPending}
                  onUpload={(file) => uploadMutation.mutate(file)}
                  onRefresh={() => documentsQuery.refetch()}
               />
            ) : null}

            {activeTab === 'settings' && isAdmin ? (
               <SettingsPanel
                  settings={settingsQuery.data}
                  settingsLoading={settingsQuery.isFetching}
                  onLoadSettings={() => void settingsQuery.refetch()}
                  onTestConnectivity={async () => {
                     try {
                        await healthQuery.refetch();
                        toast.success('Connectivity OK');
                     } catch {
                        toast.error('Connectivity test failed');
                     }
                  }}
                  health={healthQuery.data}
               />
            ) : null}
         </div>
      </AppShell>
   );
}

export default App;
