import { cn } from "@/lib/utils";

/** A drawn mark, not an emoji or a stock icon: four cells, one lit. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>
        <rect x="0" y="0" width="5" height="5" className="fill-primary" />
        <rect x="7" y="0" width="5" height="5" className="fill-current opacity-25" />
        <rect x="0" y="7" width="5" height="5" className="fill-current opacity-25" />
        <rect x="7" y="7" width="5" height="5" className="fill-current opacity-25" />
      </svg>
      <span className="font-mono text-sm font-medium tracking-[0.18em] uppercase">Synodus</span>
    </span>
  );
}
