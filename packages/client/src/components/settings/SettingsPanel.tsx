import { AlertTriangle, PlugZap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import type {
   HealthResponse,
   ProviderConfigResponse,
   SettingsState,
} from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';

type Props = {
   settings?: SettingsState;
   providers?: ProviderConfigResponse;
   settingsLoading: boolean;
   isAdmin: boolean;
   onLoadSettings: () => void;
   onTestConnectivity: () => void;
   onSaveSystem: (payload: Record<string, unknown>) => void;
   onSaveMine: (payload: Record<string, unknown>) => void;
   health?: HealthResponse;
};

export function SettingsPanel({
   settings,
   providers,
   settingsLoading,
   isAdmin,
   onLoadSettings,
   onTestConnectivity,
   onSaveSystem,
   onSaveMine,
   health,
}: Props) {
   const currentLlm =
      providers?.effective?.llmProvider ??
      providers?.llmProvider ??
      providers?.defaultLlmProvider ??
      'OLLAMA';
   const currentEmbed =
      providers?.effective?.embedProvider ??
      providers?.embedProvider ??
      providers?.defaultEmbedProvider ??
      'OLLAMA';
   const remoteSelected =
      currentLlm === 'HF_REMOTE' || currentEmbed === 'HF_REMOTE';

   return (
      <div className="space-y-4">
         <Card>
            <CardHeader>
               <CardTitle>Model Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={health?.ok ? 'success' : 'destructive'}>
                     {health?.ok ? 'Connected' : 'Disconnected'}
                  </Badge>
                  <Button variant="outline" onClick={onLoadSettings}>
                     {settingsLoading ? 'Loading...' : 'Load settings'}
                  </Button>
                  <Button onClick={onTestConnectivity}>
                     <PlugZap className="h-4 w-4" />
                     Test providers
                  </Button>
               </div>
               <p className="text-sm text-muted-foreground">
                  API endpoint: {API_BASE_URL}
               </p>

               <div className="grid gap-3 md:grid-cols-2">
                  <div>
                     <Label>LLM Provider</Label>
                     <Select
                        value={currentLlm}
                        onValueChange={(value: string) =>
                           onSaveMine({ llmProvider: value })
                        }
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="OLLAMA">
                              Ollama (Offline)
                           </SelectItem>
                           <SelectItem value="HF_REMOTE">
                              Hugging Face Online
                           </SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div>
                     <Label>Embedding Provider</Label>
                     <Select
                        value={currentEmbed}
                        onValueChange={(value: string) =>
                           onSaveMine({ embedProvider: value })
                        }
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="OLLAMA">
                              Ollama (Offline)
                           </SelectItem>
                           <SelectItem value="HF_REMOTE">
                              Hugging Face Online
                           </SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>

               {isAdmin ? (
                  <div className="space-y-2 rounded-md border p-3">
                     <p className="text-sm font-medium">
                        System defaults (admin)
                     </p>
                     <div className="grid gap-2 md:grid-cols-2">
                        <Button
                           variant="outline"
                           onClick={() =>
                              onSaveSystem({
                                 allowRemoteHf: !(
                                    providers?.allowRemoteHf ?? false
                                 ),
                              })
                           }
                        >
                           Allow remote HF:{' '}
                           {providers?.allowRemoteHf ? 'ON' : 'OFF'}
                        </Button>
                        <Button
                           variant="outline"
                           onClick={() =>
                              onSaveSystem({
                                 allowRemoteHfContext: !(
                                    providers?.allowRemoteHfContext ?? false
                                 ),
                              })
                           }
                        >
                           Allow remote context:{' '}
                           {providers?.allowRemoteHfContext ? 'ON' : 'OFF'}
                        </Button>
                     </div>
                     <Input
                        placeholder="HF chat model"
                        defaultValue={providers?.hfChatModel ?? ''}
                        onBlur={(e) =>
                           onSaveSystem({ hfChatModel: e.target.value })
                        }
                     />
                     <Input
                        placeholder="HF embed model (optional)"
                        defaultValue={providers?.hfEmbedModel ?? ''}
                        onBlur={(e) =>
                           onSaveSystem({ hfEmbedModel: e.target.value })
                        }
                     />
                     <Input
                        placeholder="HF API token"
                        type="password"
                        onBlur={(e) =>
                           e.target.value &&
                           onSaveSystem({ hfApiToken: e.target.value })
                        }
                     />
                  </div>
               ) : null}

               {remoteSelected && providers?.allowRemoteHfContext ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                     <AlertTriangle className="h-4 w-4" />
                     Warning: remote provider may receive retrieved document
                     context.
                  </p>
               ) : null}
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Current settings payload</CardTitle>
            </CardHeader>
            <CardContent>
               <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                  {JSON.stringify(settings ?? {}, null, 2)}
               </pre>
            </CardContent>
         </Card>
      </div>
   );
}
