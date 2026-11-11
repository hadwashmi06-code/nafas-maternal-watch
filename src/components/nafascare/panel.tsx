import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps {
  title: ReactNode;
  icon?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}

export function Panel({ title, icon, actions, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={cn("flex min-h-0 flex-col rounded-md border border-border bg-card", className)}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="label-caps flex items-center gap-2">
          {icon}
          {title}
        </div>
        {actions}
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
