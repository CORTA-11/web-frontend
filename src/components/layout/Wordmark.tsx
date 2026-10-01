import { cn } from "@/lib/utils";

/** The identity is typographic so it works on both paper and ink surfaces. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="text-xl font-black tracking-[-0.02em] uppercase">Synodus</span>
    </span>
  );
}
