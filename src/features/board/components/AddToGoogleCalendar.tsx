"use client";

import { useState } from "react";
import { CalendarPlusIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { googleCalendarUrl } from "@/features/board/google-calendar";
import type { Task } from "@/lib/types";

type Props = { task: Task; orgId: string; teamId: string; compact?: boolean };

export function AddToGoogleCalendar({ task, orgId, teamId, compact = false }: Props) {
  const [href, setHref] = useState<string | null>(null);
  const path = `/orgs/${encodeURIComponent(orgId)}/teams/${encodeURIComponent(teamId)}/board`;
  const available = googleCalendarUrl(task, path) !== null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon-sm" : "sm"}
        disabled={!available}
        aria-label={`Add to Google Calendar: ${task.title}`}
        title={available ? "Add to Google Calendar" : "Set a start or due date to add this task to Google Calendar"}
        onClick={() => setHref(googleCalendarUrl(task, new URL(path, window.location.origin).href))}
      >
        <CalendarPlusIcon />
        {!compact && "Add to Google Calendar"}
      </Button>
      <Dialog open={href !== null} onOpenChange={(open) => !open && setHref(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Google Calendar</DialogTitle>
            <DialogDescription>
              This shares the saved task title, description, dates and board link with Google.
              An all-day event opens in a new tab for you to review and save.
              Changes to the task will not sync, and adding it again may create a duplicate.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">{task.title}</p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setHref(null)}>Cancel</Button>
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants()}
                onClick={() => setHref(null)}>
                Open Google Calendar
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
