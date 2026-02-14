import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectItem = ({
   className,
   ...props
}: SelectPrimitive.SelectItemProps) => (
   <SelectPrimitive.Item
      className={cn('cursor-default rounded px-2 py-1 text-sm', className)}
      {...props}
   >
      <SelectPrimitive.ItemText>{props.children}</SelectPrimitive.ItemText>
   </SelectPrimitive.Item>
);
export const SelectTrigger = ({
   className,
   children,
   ...props
}: SelectPrimitive.SelectTriggerProps) => (
   <SelectPrimitive.Trigger
      className={cn(
         'flex h-9 w-full items-center justify-between rounded-md border px-3 text-sm',
         className
      )}
      {...props}
   >
      {children}
      <SelectPrimitive.Icon asChild>
         <ChevronDown className="h-4 w-4" />
      </SelectPrimitive.Icon>
   </SelectPrimitive.Trigger>
);
export const SelectContent = ({
   className,
   ...props
}: SelectPrimitive.SelectContentProps) => (
   <SelectPrimitive.Portal>
      <SelectPrimitive.Content
         className={cn('rounded-md border bg-popover p-1 shadow-md', className)}
         {...props}
      >
         <SelectPrimitive.Viewport>{props.children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
   </SelectPrimitive.Portal>
);
