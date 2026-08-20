import type { AiSummary } from "@/lib/types";
import { clock } from "@/lib/format";

export function SummaryView({ summary }: { summary: AiSummary }) {
  return (
    <section className="flex flex-col gap-3 border-l-2 border-primary bg-muted/40 p-3">
      <p className="text-sm font-medium text-pretty">{summary.headline}</p>

      {summary.bullets.length > 1 && (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground marker:text-border">
          {summary.bullets.slice(1).map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}

      {summary.decisions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="label-eyebrow">Decisions</p>
          <ul className="flex flex-col gap-1 text-sm">
            {summary.decisions.map((decision, index) => (
              <li key={index}>{decision}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="border-t border-border pt-2 text-2xs text-muted-foreground">
        <span className="font-mono">{summary.model}</span> · {summary.source_count} sources ·{" "}
        {clock(summary.generated_at)}
      </p>
    </section>
  );
}
