import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';

export function Separator({
   className,
   orientation = 'horizontal',
   ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
   return (
      <SeparatorPrimitive.Root
         className={cn(
            orientation === 'horizontal'
               ? 'h-px w-full bg-border'
               : 'h-full w-px bg-border',
            className
         )}
         orientation={orientation}
         {...props}
      />
   );
}
