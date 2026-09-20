import type { AiProcessResponse, AiSummary } from "@/lib/types";
import { clock } from "@/lib/format";

export function SummaryView({ summary }: { summary: AiSummary | AiProcessResponse["summary"] }) {
  const processSummary = "overview" in summary;
  const headline = processSummary ? summary.overview : summary.headline;
  const bullets = processSummary ? summary.key_points : summary.bullets;
  const decisions = processSummary ? summary.decisions.map((decision) => decision.text) : summary.decisions;
  return (
    <section className="flex flex-col gap-3 border-l-2 border-primary bg-muted/40 p-3">
      <p className="text-sm font-medium text-pretty">{headline}</p>

      {bullets.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted-foreground marker:text-border">
          {bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}

      {decisions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="label-eyebrow">Decisions</p>
          <ul className="flex flex-col gap-1 text-sm">
            {decisions.map((decision, index) => (
              <li key={index}>{decision}</li>
            ))}
          </ul>
        </div>
      )}

      {!processSummary && (
        <p className="border-t border-border pt-2 text-2xs text-muted-foreground">
          <span className="font-mono">{summary.model}</span> · {summary.source_count} sources ·{" "}
          {clock(summary.generated_at)}
        </p>
      )}
    </section>
  );
}
