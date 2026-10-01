import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-primary",
  muted: "bg-foreground",
};

/** Explicit words preserve status meaning within the single-accent palette. */
export function StatusDot({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 bg-foreground px-2 py-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-background", className)}>
      {children ?? <span className={cn("size-2 shrink-0", TONE[tone])} aria-hidden />}
    </span>
  );
}
