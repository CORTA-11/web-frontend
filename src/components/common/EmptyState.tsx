import type { ReactNode } from "react";

type Props = { title: string; hint?: string; action?: ReactNode };

export function EmptyState({ title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-start gap-2 border border-dashed border-border px-4 py-6">
      <p className="text-sm text-foreground">{title}</p>
      {hint && <p className="max-w-prose text-xs text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}
