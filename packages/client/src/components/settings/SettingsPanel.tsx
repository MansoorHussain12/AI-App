import { AlertTriangle, PlugZap } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import type { HealthResponse, SettingsState } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
   settings?: SettingsState;
   settingsLoading: boolean;
   onLoadSettings: () => void;
   onTestConnectivity: () => void;
   health?: HealthResponse;
};

export function SettingsPanel({
   settings,
   settingsLoading,
   onLoadSettings,
   onTestConnectivity,
   health,
}: Props) {
   const remoteSelected =
      settings?.llmProvider === 'hf_remote' ||
      settings?.embedProvider === 'hf_remote';
   const localMissing = settings?.hfLocalStatus === 'HF Local model not found';

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
                     Test connectivity
                  </Button>
               </div>
               <p className="text-sm text-muted-foreground">
                  API endpoint: {API_BASE_URL}
               </p>
               {remoteSelected ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                     <AlertTriangle className="h-4 w-4" />
                     This may send data outside the factory network.
                  </p>
               ) : null}
               {localMissing ? (
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                     <AlertTriangle className="h-4 w-4" />
                     HF Local model not found.
                  </p>
               ) : null}
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle>Current config</CardTitle>
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
