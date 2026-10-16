import { type ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-strong border border-accent/20">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">{description}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
