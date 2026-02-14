import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = (props: TooltipPrimitive.TooltipContentProps) => (
   <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
         className="z-50 rounded bg-foreground px-2 py-1 text-xs text-background"
         sideOffset={4}
         {...props}
      />
   </TooltipPrimitive.Portal>
);
