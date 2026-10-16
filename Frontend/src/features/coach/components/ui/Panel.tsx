import type { ComponentType, ReactNode } from "react";
import { cn } from "../../../../lib/utils";

interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  interactive?: boolean;
  as?: "section" | "div" | "article";
}

/** Raised 3D surface with an optional header row. The default container for coach content. */
export function Panel({ title, description, icon: Icon, actions, children, className, bodyClassName, interactive, as: Tag = "section" }: PanelProps) {
  const hasHeader = title || actions;
  return (
    <Tag className={cn("panel-3d", interactive && "panel-3d-interactive", className)}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="icon-tile-3d h-9 w-9 shrink-0 bg-accent-soft text-accent-strong dark:text-accent">
                <Icon size={17} />
              </span>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-[15px] font-extrabold leading-tight tracking-tight text-text-primary">{title}</h2>}
              {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-5 sm:p-6", hasHeader && "pt-4 sm:pt-4", bodyClassName)}>{children}</div>
    </Tag>
  );
}
