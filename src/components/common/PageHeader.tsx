import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, meta, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
      <div className="flex flex-col gap-1">
        {eyebrow && <span className="label-eyebrow">{eyebrow}</span>}
        <h1 className="text-lg leading-tight font-semibold text-balance">{title}</h1>
        {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
