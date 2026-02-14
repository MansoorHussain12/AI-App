import { LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export type AppTab = 'chat' | 'documents' | 'settings';

type Props = {
   activeTab: AppTab;
   setActiveTab: (tab: AppTab) => void;
   isAdmin: boolean;
   providerStatus: 'healthy' | 'warning' | 'error';
   onLogout: () => void;
   children: React.ReactNode;
};

export function AppShell({
   activeTab,
   setActiveTab,
   isAdmin,
   providerStatus,
   onLogout,
   children,
}: Props) {
   return (
      <div className="min-h-screen bg-muted/40">
         <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
               <h1 className="text-lg font-semibold">Factory RAG Assistant</h1>
               <div className="flex items-center gap-2">
                  <Badge
                     variant={
                        providerStatus === 'healthy'
                           ? 'success'
                           : providerStatus === 'warning'
                             ? 'secondary'
                             : 'destructive'
                     }
                  >
                     {providerStatus === 'healthy'
                        ? 'Provider healthy'
                        : providerStatus === 'warning'
                          ? 'Provider warning'
                          : 'Provider error'}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                     <LogOut className="h-4 w-4" />
                     Logout
                  </Button>
               </div>
            </div>
         </header>
         <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[220px_1fr]">
            <aside className="rounded-lg border bg-background p-2">
               <nav className="flex flex-col gap-1">
                  <Button
                     variant={activeTab === 'chat' ? 'default' : 'ghost'}
                     onClick={() => setActiveTab('chat')}
                  >
                     Chat
                  </Button>
                  {isAdmin ? (
                     <Button
                        variant={
                           activeTab === 'documents' ? 'default' : 'ghost'
                        }
                        onClick={() => setActiveTab('documents')}
                     >
                        Documents
                     </Button>
                  ) : null}
                  <Button
                     variant={activeTab === 'settings' ? 'default' : 'ghost'}
                     onClick={() => setActiveTab('settings')}
                  >
                     Settings
                  </Button>
               </nav>
               <Separator className="my-2" />
               <p className="px-2 text-xs text-muted-foreground">
                  Offline/online capable via local backend endpoint.
               </p>
            </aside>
            <main>{children}</main>
         </div>
      </div>
   );
}
