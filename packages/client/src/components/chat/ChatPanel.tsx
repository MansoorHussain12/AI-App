import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import type { Citation, DocumentItem } from '@/lib/types';

type Props = {
   indexedDocs: DocumentItem[];
   selectedDocs: string[];
   onToggleDoc: (id: string, checked: boolean) => void;
   question: string;
   onQuestionChange: (value: string) => void;
   onAsk: () => void;
   asking: boolean;
   answer: string;
   citations: Citation[];
};

export function ChatPanel({
   indexedDocs,
   selectedDocs,
   onToggleDoc,
   question,
   onQuestionChange,
   onAsk,
   asking,
   answer,
   citations,
}: Props) {
   const [openCitation, setOpenCitation] = useState<Citation | null>(null);

   return (
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
         <Card>
            <CardHeader>
               <CardTitle>Document scope</CardTitle>
            </CardHeader>
            <CardContent>
               <ScrollArea className="h-72 pr-2">
                  <div className="space-y-2">
                     {indexedDocs.map((doc) => (
                        <label
                           className="flex items-center gap-2 text-sm"
                           key={doc.id}
                        >
                           <input
                              type="checkbox"
                              checked={selectedDocs.includes(doc.id)}
                              onChange={(e) =>
                                 onToggleDoc(doc.id, e.target.checked)
                              }
                           />
                           <span>{doc.title}</span>
                        </label>
                     ))}
                     {!indexedDocs.length ? (
                        <p className="text-sm text-muted-foreground">
                           No indexed documents yet.
                        </p>
                     ) : null}
                  </div>
               </ScrollArea>
            </CardContent>
         </Card>

         <div className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>Ask a question</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                  <Textarea
                     value={question}
                     onChange={(e) => onQuestionChange(e.target.value)}
                     placeholder="Ask a factory question"
                  />
                  <Button onClick={onAsk} disabled={!question.trim() || asking}>
                     {asking ? 'Asking...' : 'Ask'}
                  </Button>
               </CardContent>
            </Card>

            <Card>
               <CardHeader>
                  <CardTitle>Answer</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                     <ReactMarkdown>
                        {answer || '_No answer yet._'}
                     </ReactMarkdown>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     {citations.map((c) => (
                        <Dialog
                           key={c.chunkId}
                           open={openCitation?.chunkId === c.chunkId}
                           onOpenChange={(open) =>
                              setOpenCitation(open ? c : null)
                           }
                        >
                           <DialogTrigger asChild>
                              <Badge
                                 variant="outline"
                                 className="cursor-pointer"
                              >
                                 {c.title} • {c.pageOrSlide}
                              </Badge>
                           </DialogTrigger>
                           <DialogContent>
                              <DialogHeader>
                                 <DialogTitle>{c.title}</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                 {c.pageOrSlide}
                              </p>
                              <p className="text-sm">{c.snippet}</p>
                           </DialogContent>
                        </Dialog>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}
