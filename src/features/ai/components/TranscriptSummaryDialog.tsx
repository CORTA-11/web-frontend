"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/Field";
import { ExtractedTasks } from "@/features/ai/components/ExtractedTasks";
import { SummaryView } from "@/features/ai/components/SummaryView";
import { useExtractTasks, useTranscriptSummary } from "@/features/ai/queries";
import { useMembers } from "@/features/teams/queries";
import { useOrgSettings } from "@/features/settings/queries";
import { errorMessage } from "@/lib/http";
import { can, type Actor } from "@/lib/rbac";

export function TranscriptSummaryDialog({ teamId, actor }: { teamId: string; actor: Actor | null }) {
  const { orgId } = useParams<{ orgId: string }>();
  const org = useOrgSettings(orgId);
  const members = useMembers(teamId);
  const summarise = useTranscriptSummary(teamId);
  const extract = useExtractTasks(teamId);
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("");

  if (!org.data?.ai.enabled) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>Summarise transcript</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Summarise a transcript</DialogTitle>
            <DialogDescription>
              Paste meeting notes or a transcript. Ask a follow-up question to focus the summary on
              one area.
            </DialogDescription>
          </DialogHeader>

          <Field label="Transcript" htmlFor="transcript">
            <Textarea
              id="transcript"
              rows={7}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste the meeting minutes here."
            />
          </Field>

          <Field label="Follow-up question" htmlFor="transcript-question" hint="Optional.">
            <Input
              id="transcript-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What did we decide about the calibration?"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!transcript.trim() || summarise.isPending}
              onClick={() => summarise.mutate({ transcript, question: question || undefined })}
            >
              {summarise.isPending ? "Working…" : "Summarise"}
            </Button>
            {can(actor, "ai:extract_tasks") && (
              <Button
                size="sm"
                variant="outline"
                disabled={!transcript.trim() || extract.isPending}
                onClick={() => extract.mutate({ transcript })}
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
