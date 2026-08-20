import { cn } from "@/lib/utils";

export type Tone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-primary",
  muted: "bg-muted-foreground/50",
};

/** State reads as a mark plus a word — never a filled pill. */
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
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", TONE[tone])} aria-hidden />
      {children}
    </span>
  );
}
