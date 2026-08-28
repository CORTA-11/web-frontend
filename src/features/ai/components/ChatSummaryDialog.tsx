"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { ExtractedTasks } from "@/features/ai/components/ExtractedTasks";
import { SummaryView } from "@/features/ai/components/SummaryView";
import { useChatSummary, useExtractTasks } from "@/features/ai/queries";
import { useMembers } from "@/features/teams/queries";
import { useOrgSettings } from "@/features/settings/queries";
import { errorMessage } from "@/lib/http";
import { can, type Actor } from "@/lib/rbac";

const asDate = (date: Date) => date.toISOString().slice(0, 10);

export function ChatSummaryDialog({ teamId, actor }: { teamId: string; actor: Actor | null }) {
  const { orgId } = useParams<{ orgId: string }>();
  const org = useOrgSettings(orgId);
  const members = useMembers(teamId, orgId);
  const summarise = useChatSummary(teamId);
  const extract = useExtractTasks(teamId);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from: asDate(subDays(new Date(), 7)), to: asDate(new Date()) });

  if (!org.data?.ai.enabled) return null;

  const payload = {
    from: new Date(`${range.from}T00:00:00`).toISOString(),
    to: new Date(`${range.to}T23:59:59`).toISOString(),
  };

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
            <Button size="sm" disabled={summarise.isPending} onClick={() => summarise.mutate(payload)}>
              {summarise.isPending ? "Working…" : "Summarise"}
            </Button>
            {can(actor, "ai:extract_tasks") && (
              <Button
                size="sm"
                variant="outline"
                disabled={extract.isPending}
                onClick={() => extract.mutate(payload)}
              >
                Extract tasks
              </Button>
            )}
          </div>

          {summarise.isError && <p className="text-xs text-danger">{errorMessage(summarise.error)}</p>}
          {summarise.data && <SummaryView summary={summarise.data} />}

          {extract.isError && <p className="text-xs text-danger">{errorMessage(extract.error)}</p>}
          {extract.data && (
            <ExtractedTasks
              teamId={teamId}
              orgId={orgId}
              members={members.data ?? []}
              tasks={extract.data.tasks}
              onAdded={() => {
                extract.reset();
                setOpen(false);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
