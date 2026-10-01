"use client";

import { useState } from "react";
import { useFormat } from "@/lib/use-format";
import { Button } from "@/components/ui/button";
import { ExtractedTasks } from "@/features/ai/components/ExtractedTasks";
import { SummaryView } from "@/features/ai/components/SummaryView";
import { useAiInbox } from "@/features/ai/useAiInbox";
import { numericKey } from "@/features/teams/api";
import { useMembers, useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";
import type { ExtractedTask } from "@/lib/types";

export function AiInboxPage({ orgId, teamId }: { orgId: string; teamId: string }) {
  const { day: date } = useFormat();
  const inbox = useAiInbox();
  const members = useMembers(teamId, orgId);
  const { actor } = useTeamContext(teamId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = inbox.items.filter((item) => item.orgId === orgId && item.teamId === teamId);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const result = selected?.result;
  const candidates: ExtractedTask[] = result && "action_items" in result
    ? result.action_items.map((item) => ({
      title: item.title,
      description: item.description,
      assignee_id: item.assignee_user_id ? numericKey(item.assignee_user_id) : null,
      priority: item.priority === "urgent" ? "high" : item.priority ?? "medium",
      start_date: null,
      due_date: item.due_date,
      evidence: item.source_message_ids.join(", "),
    }))
    : [];

  return (
    <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)]">
      <div className="min-w-0 border border-border">
        <p className="label-eyebrow border-b border-border p-3">Requests</p>
        {!items.length && <p className="p-4 text-sm text-muted-foreground">No chat summaries yet. Start one from Chat.</p>}
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => { setSelectedId(item.id); inbox.markRead(item.id); }}
                className={`w-full border-l-2 p-3 text-left transition-colors hover:bg-muted/50 ${selectedId === item.id ? "border-primary bg-muted/40" : "border-transparent"}`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className={`size-1.5 rounded-full ${item.status === "error" ? "bg-danger" : item.status === "ready" && !item.read ? "bg-primary" : "bg-muted-foreground"}`} />
                  Chat summary
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{date(item.from)} – {date(item.to)}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.status === "pending" ? "Working…" : item.status === "error" ? "Failed" : "Ready"} · {date(item.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 border border-border p-4">
        {!selected && <p className="text-sm text-muted-foreground">Select a request to view its summary and suggested tasks.</p>}
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-semibold">Chat summary</h2>
                <p className="data-mono text-xs text-muted-foreground">{date(selected.from)} – {date(selected.to)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { inbox.dismiss(selected.id); setSelectedId(null); }}>Dismiss</Button>
            </div>
            {selected.status === "pending" && <p className="text-sm text-muted-foreground">Working on your summary. You can visit another page.</p>}
            {selected.status === "error" && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-danger">{selected.error ?? "The request failed."}</p>
                <Button size="sm" variant="outline" onClick={() => { inbox.submit({ orgId, teamId, from: selected.from, to: selected.to }); inbox.dismiss(selected.id); setSelectedId(null); }}>Try again</Button>
              </div>
            )}
            {result && <SummaryView summary={"summary" in result ? result.summary : result} />}
            {result && candidates.length > 0 && can(actor, "ai:extract_tasks") && (
              selected.tasksAdded
                ? <p className="text-sm text-muted-foreground">Suggested tasks added to the board.</p>
                : <ExtractedTasks key={selected.id} teamId={teamId} orgId={orgId} members={members.data ?? []} tasks={candidates} onAdded={() => inbox.markTasksAdded(selected.id)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
