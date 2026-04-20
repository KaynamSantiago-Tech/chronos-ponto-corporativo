import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Nada por aqui",
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground ${className ?? ""}`}
    >
      {icon ? <div className="text-muted-foreground/70">{icon}</div> : null}
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
