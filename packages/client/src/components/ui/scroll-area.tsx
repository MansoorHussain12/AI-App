import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

export function ScrollArea({
   className,
   children,
   ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
   return (
      <ScrollAreaPrimitive.Root
         className={cn('relative overflow-hidden', className)}
         {...props}
      >
         <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
            {children}
         </ScrollAreaPrimitive.Viewport>
         <ScrollAreaPrimitive.ScrollAreaScrollbar
            orientation="vertical"
            className="w-2 bg-muted"
         >
            <ScrollAreaPrimitive.ScrollAreaThumb className="rounded-full bg-border" />
         </ScrollAreaPrimitive.ScrollAreaScrollbar>
      </ScrollAreaPrimitive.Root>
   );
}
