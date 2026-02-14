import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = ({
   className,
   ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
   <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40" />
      <DialogPrimitive.Content
         className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6',
            className
         )}
         {...props}
      />
   </DialogPrimitive.Portal>
);
export const DialogHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
   <div className="space-y-1" {...props} />
);
export const DialogTitle = (
   props: React.ComponentProps<typeof DialogPrimitive.Title>
) => <DialogPrimitive.Title className="text-lg font-semibold" {...props} />;
