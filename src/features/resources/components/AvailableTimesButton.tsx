"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { summariseAvailabilityLocal } from "@/features/resources/availability";
import { useTimeZone } from "@/lib/use-time-zone";
import type { Resource } from "@/lib/types";

export function AvailableTimesButton({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  const zone = useTimeZone();
  const times = resource.enabled ? summariseAvailabilityLocal(resource.availability).split(" · ") : [];

  return (
    <>
      <Button size="xs" variant="outline" onClick={() => setOpen(true)} aria-label={`Available times for ${resource.name}`}>
        Available times
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Available times · {resource.name}</DialogTitle>
            <DialogDescription>{zone} · Weekly hours. Check Schedule for booked slots.</DialogDescription>
          </DialogHeader>
          {resource.enabled && resource.availability.length ? (
            <ul className="divide-y divide-border text-sm tabular-nums">
              {times.map((time, index) => <li key={`${index}-${time}`} className="py-2">{time}</li>)}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Not bookable</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
