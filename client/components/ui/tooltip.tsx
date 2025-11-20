import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur-lg border",
      "bg-popover text-popover-foreground border-border",
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      "relative",
      // Speech bubble tail styles
      "after:absolute after:content-[''] after:w-3 after:h-3 after:bg-popover after:border-border",
      "data-[side=top]:after:bottom-[-6px] data-[side=top]:after:left-1/2 data-[side=top]:after:-translate-x-1/2 data-[side=top]:after:rotate-45 data-[side=top]:after:border-r data-[side=top]:after:border-b",
      "data-[side=bottom]:after:top-[-6px] data-[side=bottom]:after:left-1/2 data-[side=bottom]:after:-translate-x-1/2 data-[side=bottom]:after:rotate-45 data-[side=bottom]:after:border-l data-[side=bottom]:after:border-t",
      "data-[side=left]:after:right-[-6px] data-[side=left]:after:top-1/2 data-[side=left]:after:-translate-y-1/2 data-[side=left]:after:rotate-45 data-[side=left]:after:border-t data-[side=left]:after:border-r",
      "data-[side=right]:after:left-[-6px] data-[side=right]:after:top-1/2 data-[side=right]:after:-translate-y-1/2 data-[side=right]:after:rotate-45 data-[side=right]:after:border-b data-[side=right]:after:border-l",
      // Add a chevron icon for speech bubble effect
      "before:absolute before:content-['›'] before:text-popover-foreground/80 before:font-bold before:text-lg",
      "data-[side=right]:before:right-2 data-[side=right]:before:top-1/2 data-[side=right]:before:-translate-y-1/2",
      "data-[side=left]:before:left-2 data-[side=left]:before:top-1/2 data-[side=left]:before:-translate-y-1/2 data-[side=left]:before:rotate-180",
      "data-[side=top]:before:bottom-1 data-[side=top]:before:left-1/2 data-[side=top]:before:-translate-x-1/2 data-[side=top]:before:rotate-90",
      "data-[side=bottom]:before:top-1 data-[side=bottom]:before:left-1/2 data-[side=bottom]:before:-translate-x-1/2 data-[side=bottom]:before:-rotate-90",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
