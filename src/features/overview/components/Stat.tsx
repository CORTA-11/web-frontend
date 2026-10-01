import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
};

export function Stat({ label, value, hint, highlight }: Props) {
  return (
    <div className={cn("stat-cell flex flex-col gap-4", highlight && "stat-cell--highlight")}>
      <span className="label-eyebrow">{label}</span>
      <span className="text-[32px] leading-none font-black tracking-[-0.02em]" data-numeric>
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
