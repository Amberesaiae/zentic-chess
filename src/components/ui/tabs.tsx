import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("inline-flex h-10 items-center gap-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface-raised)] p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return <TabsPrimitive.Trigger className={cn("inline-flex h-8 items-center justify-center rounded-[7px] px-3 text-xs font-semibold text-[var(--muted)] outline-none transition-colors hover:text-[var(--ink)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--ink)] data-[state=active]:shadow-[0_1px_3px_rgba(21,69,83,.12)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]", className)} {...props} />;
}

export const TabsContent = TabsPrimitive.Content;
