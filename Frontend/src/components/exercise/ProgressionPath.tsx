import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Exercise } from "../../types";
import { findExerciseByName } from "../../services/mock/exerciseLibrary";
import { cn } from "../../lib/utils";

type Role = "previous" | "current" | "next";

export function ProgressionPath({ progression }: { progression: Exercise["progression"] }) {
  const nodes: { name: string; role: Role }[] = [
    progression.previous ? { name: progression.previous, role: "previous" as const } : null,
    { name: progression.current, role: "current" as const },
    progression.next ? { name: progression.next, role: "next" as const } : null,
  ].filter((node): node is { name: string; role: Role } => node !== null);

  if (nodes.length <= 1) {
    return <p className="text-sm text-text-secondary">Chưa có lộ trình nâng cấp cho bài tập này.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {nodes.map((node, i) => {
        const linkTarget = node.role === "current" ? undefined : findExerciseByName(node.name);
        const isCurrent = node.role === "current";

        const card = (
          <div
            className={cn(
              "rounded-md border px-4 py-3 text-center transition",
              isCurrent
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary"
            )}
          >
            <div className={cn("font-semibold", isCurrent ? "text-base" : "text-sm")}>{node.name}</div>
          </div>
        );

        return (
          <div key={node.name} className="flex items-center gap-2">
            {linkTarget ? <Link to={`/exercises/${linkTarget.id}`}>{card}</Link> : card}
            {i < nodes.length - 1 && <ChevronRight size={18} className="flex-none text-text-secondary" />}
          </div>
        );
      })}
    </div>
  );
}
