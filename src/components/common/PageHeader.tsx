import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, meta, actions }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b-3 border-border pb-6">
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow && <span className="label-eyebrow">{eyebrow}</span>}
        <h1 className="text-[24px] leading-[1.05] font-black tracking-[-0.02em] break-words">{title}</h1>
        {meta && <div className="text-base text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
