import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export const TabsList = ({
   className,
   ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
   <TabsPrimitive.List
      className={cn(
         'inline-flex h-10 items-center rounded-md bg-muted p-1',
         className
      )}
      {...props}
   />
);
export const TabsTrigger = ({
   className,
   ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
   <TabsPrimitive.Trigger
      className={cn(
         'inline-flex items-center rounded-sm px-3 py-1.5 text-sm data-[state=active]:bg-background',
         className
      )}
      {...props}
   />
);
export const TabsContent = ({
   className,
   ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
   <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />
);
