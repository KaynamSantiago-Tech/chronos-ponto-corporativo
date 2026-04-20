"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !total) return null;

  return (
    <div
      className={`mt-4 flex items-center justify-between text-xs text-muted-foreground ${className ?? ""}`}
    >
      <span>
        Página {page} de {totalPages}
        {typeof total === "number" ? ` · ${total} registro(s)` : null}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
