import './App.css';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type User = { username: string; role: 'ADMIN' | 'USER' };
type DocumentItem = {
   id: string;
   title: string;
   status: string;
   sourceType: string;
   ingestionJobs: { progress: number; stage: string; status: string }[];
};

type Citation = {
   chunkId: string;
   title: string;
   pageOrSlide: string;
   snippet: string;
};

const api = axios.create({
   baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

function App() {
   const [token, setToken] = useState(localStorage.getItem('token') ?? '');
   const [user, setUser] = useState<User | null>(null);
   const [docs, setDocs] = useState<DocumentItem[]>([]);
   const [question, setQuestion] = useState('');
   const [answer, setAnswer] = useState('');
   const [citations, setCitations] = useState<Citation[]>([]);
   const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
   const [settings, setSettings] = useState<Record<string, string | number>>(
      {}
   );

   useEffect(() => {
      api.defaults.headers.common.Authorization = token
         ? `Bearer ${token}`
         : '';
      if (token) loadDocs();
   }, [token]);

   async function loadDocs() {
      const response = await api.get('/api/documents');
      setDocs(response.data);
   }

   async function doLogin(formData: FormData) {
      const username = String(formData.get('username') ?? '');
      const password = String(formData.get('password') ?? '');
      const response = await api.post('/api/auth/login', {
         username,
         password,
      });
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
   }

   async function upload(file: File) {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/api/documents/upload', fd);
      await loadDocs();
   }

   async function chat() {
      const response = await api.post('/api/chat', {
         question,
         docIds: selectedDocs.length ? selectedDocs : undefined,
      });
      setAnswer(response.data.answer);
      setCitations(response.data.citations);
   }

   async function loadSettings() {
      const response = await api.get('/api/settings');
      setSettings(response.data);
   }

   const indexedDocs = useMemo(
      () => docs.filter((d) => d.status === 'INDEXED'),
      [docs]
   );

   if (!token) {
      return (
         <main className="container">
            <h1>Factory RAG Assistant</h1>
            <form action={doLogin} className="card form">
               <input
                  name="username"
                  placeholder="username"
                  defaultValue="admin"
               />
               <input
                  name="password"
                  type="password"
                  placeholder="password"
                  defaultValue="admin123"
               />
               <button type="submit">Login</button>
            </form>
         </main>
      );
   }

   return (
      <main className="container">
         <h1>Factory RAG Assistant</h1>
         <div className="grid">
            {user?.role === 'ADMIN' && (
               <section className="card">
                  <h2>Documents</h2>
                  <input
                     type="file"
                     onChange={(e) =>
                        e.target.files?.[0] && upload(e.target.files[0])
                     }
                  />
                  <button onClick={loadDocs}>Refresh</button>
                  <ul>
                     {docs.map((doc) => (
                        <li key={doc.id}>
                           {doc.title} ({doc.sourceType}) - {doc.status}{' '}
                           {doc.ingestionJobs[0]
                              ? `[${doc.ingestionJobs[0].stage} ${doc.ingestionJobs[0].progress}%]`
                              : ''}
                        </li>
                     ))}
                  </ul>
               </section>
            )}

            <section className="card">
               <h2>Chat</h2>
               <p>Select documents:</p>
               <div>
                  {indexedDocs.map((doc) => (
                     <label key={doc.id}>
                        <input
                           type="checkbox"
                           checked={selectedDocs.includes(doc.id)}
                           onChange={(e) =>
                              setSelectedDocs((prev) =>
                                 e.target.checked
                                    ? [...prev, doc.id]
                                    : prev.filter((id) => id !== doc.id)
                              )
                           }
                        />
                        {doc.title}
                     </label>
                  ))}
               </div>
               <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a factory question"
               />
               <button onClick={chat}>Ask</button>
               <pre>{answer}</pre>
               <h3>Sources</h3>
               <ul>
                  {citations.map((c) => (
                     <li key={c.chunkId}>
                        {c.title} - {c.pageOrSlide}: {c.snippet}
                     </li>
                  ))}
               </ul>
            </section>

            {user?.role === 'ADMIN' && (
               <section className="card">
                  <h2>Settings</h2>
                  <button onClick={loadSettings}>Load settings</button>
                  <pre>{JSON.stringify(settings, null, 2)}</pre>
                  <button
                     onClick={() =>
                        api
                           .get('/api/health/ollama')
                           .then(() => alert('Ollama OK'))
                           .catch(() => alert('Ollama failed'))
                     }
                  >
                     Test Ollama Connectivity
                  </button>
               </section>
            )}
         </div>
      </main>
   );
}

export default App;
