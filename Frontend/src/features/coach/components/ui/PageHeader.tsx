import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  meta?: ReactNode;
}

export function PageHeader({ title, description, actions, back, meta }: PageHeaderProps) {
  return (
    <div className="mb-6 animate-rise">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1 rounded-lg text-xs font-bold text-text-secondary transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent">
          <ChevronLeft size={15} aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-text-secondary">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}
