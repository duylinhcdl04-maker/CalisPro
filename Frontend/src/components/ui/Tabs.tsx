import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/80 bg-surface-elevated/80 dark:bg-slate-900/80 p-1 backdrop-blur-xs shadow-2xs",
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-bold text-text-secondary transition-all duration-200 select-none",
        "hover:text-text-primary hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
        "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:font-extrabold",
        "dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-[#8CA9FF] dark:data-[state=active]:to-[#547EFF] dark:data-[state=active]:text-white dark:data-[state=active]:shadow-[0_2px_12px_rgba(140,169,255,0.4)]",
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
