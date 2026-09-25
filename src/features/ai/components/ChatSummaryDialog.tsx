"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { ExtractedTasks } from "@/features/ai/components/ExtractedTasks";
import { SummaryView } from "@/features/ai/components/SummaryView";
import { useChatSummary } from "@/features/ai/queries";
import { useMembers } from "@/features/teams/queries";
import { errorMessage } from "@/lib/http";
import { can, type Actor } from "@/lib/rbac";
import { numericKey } from "@/features/teams/api";
import type { ExtractedTask } from "@/lib/types";

const asDate = (date: Date) => format(date, "yyyy-MM-dd");

export function ChatSummaryDialog({ teamId, actor }: { teamId: string; actor: Actor | null }) {
  const { orgId } = useParams<{ orgId: string }>();
  const members = useMembers(teamId, orgId);
  const summarise = useChatSummary(orgId, teamId);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from: asDate(subDays(new Date(), 7)), to: asDate(new Date()) });

  const validRange = Boolean(range.from && range.to && range.from <= range.to);
  const submit = () => {
    if (!validRange) return;
    summarise.mutate({
      from: new Date(`${range.from}T00:00:00`).toISOString(),
      to: new Date(`${range.to}T23:59:59.999`).toISOString(),
    });
  };

  const processResult = summarise.data && "action_items" in summarise.data ? summarise.data : null;
  const candidates: ExtractedTask[] = processResult?.action_items.map((item) => ({
    title: item.title,
    description: item.description,
    assignee_id: item.assignee_user_id ? numericKey(item.assignee_user_id) : null,
    priority: item.priority === "urgent" ? "high" : item.priority ?? "medium",
    start_date: null,
    due_date: item.due_date,
    evidence: item.source_message_ids.join(", "),
  })) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Summarise chat</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Summarise chat</DialogTitle>
            <DialogDescription>
              Only messages in this team and date range are sent to the context service.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-end gap-3">
            <Field label="From" htmlFor="summary-from">
              <Input
                id="summary-from"
                type="date"
                value={range.from}
                onChange={(event) => setRange({ ...range, from: event.target.value })}
              />
            </Field>
            <Field label="To" htmlFor="summary-to">
              <Input
                id="summary-to"
                type="date"
                value={range.to}
                onChange={(event) => setRange({ ...range, to: event.target.value })}
              />
            </Field>
            <Button size="sm" disabled={!validRange || summarise.isPending} onClick={submit}>
              {summarise.isPending ? "Working…" : "Summarise"}
            </Button>
          </div>

          {!validRange && <p className="text-xs text-danger">Choose a valid date range with From on or before To.</p>}
          {summarise.isError && <p className="text-xs text-danger">{errorMessage(summarise.error)}</p>}
          {summarise.data && <SummaryView summary={"summary" in summarise.data ? summarise.data.summary : summarise.data} />}

          {processResult && can(actor, "ai:extract_tasks") && (
            <ExtractedTasks
              teamId={teamId}
              orgId={orgId}
              members={members.data ?? []}
              tasks={candidates}
              onAdded={() => {
                summarise.reset();
                setOpen(false);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
