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
import { useChatSummary } from "@/features/ai/queries";
import { useMembers } from "@/features/teams/queries";
import { useOrgSettings } from "@/features/settings/queries";
import { errorMessage } from "@/lib/http";
import { can, type Actor } from "@/lib/rbac";
import { numericKey } from "@/features/teams/api";
import type { ExtractedTask } from "@/lib/types";

const asDate = (date: Date) => date.toISOString().slice(0, 10);

export function ChatSummaryDialog({ teamId, actor }: { teamId: string; actor: Actor | null }) {
  const { orgId } = useParams<{ orgId: string }>();
  const org = useOrgSettings(orgId);
  const members = useMembers(teamId, orgId);
  const summarise = useChatSummary(orgId, teamId);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from: asDate(subDays(new Date(), 7)), to: asDate(new Date()) });
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("");
  const [apiToken, setApiToken] = useState("");

  if (!org.data?.ai.enabled) return null;

  const payload = {
    from: new Date(`${range.from}T00:00:00`).toISOString(),
    to: new Date(`${range.to}T23:59:59`).toISOString(),
    provider: {
      protocol: "openai_chat_completions_v1" as const,
      endpoint_url: endpoint || org.data?.ai.custom_endpoint || "",
      model: model || org.data?.ai.model || "",
      api_token: apiToken,
      structured_output: true,
    },
    response_language: "en",
    max_action_items: 10,
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
            <Field label="Endpoint" htmlFor="summary-endpoint">
              <Input id="summary-endpoint" className="min-w-72 font-mono text-xs" value={endpoint || org.data?.ai.custom_endpoint || ""} onChange={(event) => setEndpoint(event.target.value)} placeholder="https://.../v1/chat/completions" />
            </Field>
            <Field label="Model" htmlFor="summary-model">
              <Input id="summary-model" className="font-mono text-xs" value={model || org.data?.ai.model || ""} onChange={(event) => setModel(event.target.value)} />
            </Field>
            <Field label="API token" htmlFor="summary-token">
              <Input id="summary-token" type="password" autoComplete="off" value={apiToken} onChange={(event) => setApiToken(event.target.value)} />
            </Field>
            <Button size="sm" disabled={summarise.isPending} onClick={() => summarise.mutate(payload)}>
              {summarise.isPending ? "Working…" : "Summarise"}
            </Button>
          </div>

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
