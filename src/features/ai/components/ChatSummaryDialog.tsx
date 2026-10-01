"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { subDays } from "date-fns";
import { dateTimeInput, fromDateTimeInput } from "@/lib/time-zone";
import { useTimeZone } from "@/lib/use-time-zone";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useAiInbox } from "@/features/ai/useAiInbox";

const asDate = (date: Date) => dateTimeInput(date).slice(0, 10);

export function ChatSummaryDialog({ teamId }: { teamId: string }) {
  const zone = useTimeZone();
  const { orgId } = useParams<{ orgId: string }>();
  const inbox = useAiInbox();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState({ from: asDate(subDays(new Date(), 7)), to: asDate(new Date()) });

  const from = fromDateTimeInput(`${range.from}T00:00:00`, zone);
  const to = fromDateTimeInput(`${range.to}T23:59:59.999`, zone);
  const validRange = Number.isFinite(from.getTime()) && Number.isFinite(to.getTime()) && from <= to;
  const submit = () => {
    if (!validRange) return;
    inbox.submit({ orgId, teamId,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Summarise chat</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Summarise chat</DialogTitle>
            <DialogDescription>
              Only messages in this team and date range ({zone}) are sent to the context service.
              The result will appear in your AI inbox; you can close this dialog while it runs.
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
            <Button size="sm" disabled={!validRange} onClick={submit}>
              Send to inbox
            </Button>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href={`/orgs/${orgId}/teams/${teamId}/ai-inbox`}
              onClick={() => setOpen(false)}
            >
              Open inbox
            </Link>
          </div>

          {!validRange && <p className="text-xs text-danger">Choose a valid date range with From on or before To.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
