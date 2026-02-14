import { useRef } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/components/ui/table';
import type { DocumentItem } from '@/lib/types';

type Props = {
   docs: DocumentItem[];
   loading: boolean;
   uploading: boolean;
   onUpload: (file: File) => void;
   onRefresh: () => void;
   onReindex: (id: string) => void;
   onDelete: (id: string) => void;
};

const statusVariant = (status: string) => {
   if (status === 'INDEXED') return 'success';
   if (status === 'PROCESSING') return 'secondary';
   if (status === 'FAILED') return 'destructive';
   return 'outline';
};

export function DocumentsPanel({
   docs,
   loading,
   uploading,
   onUpload,
   onRefresh,
   onReindex,
   onDelete,
}: Props) {
   const fileInput = useRef<HTMLInputElement>(null);

   return (
      <div className="space-y-4">
         <Card>
            <CardHeader>
               <CardTitle>Upload documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <p className="text-sm text-muted-foreground">
                  Allowed: PDF, DOCX, PPT, PPTX
               </p>
               <input
                  className="hidden"
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) onUpload(file);
                  }}
               />
               <Button
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
               >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Choose file'}
               </Button>
            </CardContent>
         </Card>

         <Card>
            <CardHeader className="flex-row items-center justify-between">
               <CardTitle>Documents</CardTitle>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
               >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
               </Button>
            </CardHeader>
            <CardContent>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress/Stage</TableHead>
                        <TableHead>Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {docs.map((doc) => {
                        const latest = doc.ingestionJobs?.[0];
                        return (
                           <TableRow key={doc.id}>
                              <TableCell>{doc.title}</TableCell>
                              <TableCell>{doc.sourceType}</TableCell>
                              <TableCell>
                                 <Badge
                                    variant={statusVariant(doc.status) as any}
                                 >
                                    {doc.status}
                                 </Badge>
                              </TableCell>
                              <TableCell>
                                 {latest ? (
                                    <div className="space-y-1">
                                       <p className="text-xs text-muted-foreground">
                                          {latest.stage} • {latest.progress}%
                                       </p>
                                       <div className="h-2 rounded bg-muted">
                                          <div
                                             className="h-2 rounded bg-primary"
                                             style={{
                                                width: `${latest.progress}%`,
                                             }}
                                          />
                                       </div>
                                    </div>
                                 ) : (
                                    '—'
                                 )}
                              </TableCell>
                              <TableCell>
                                 <div className="flex gap-2">
                                    <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => onReindex(doc.id)}
                                    >
                                       Reindex
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="destructive"
                                       onClick={() => onDelete(doc.id)}
                                    >
                                       Delete
                                    </Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        );
                     })}
                  </TableBody>
               </Table>
            </CardContent>
         </Card>
      </div>
   );
}
