"use client";

import { useState } from "react";
import { addHours } from "date-fns";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/Field";
import {
  findClash, fitsAvailability, localTimeZone, summariseAvailability, summariseAvailabilityLocal,
} from "@/features/resources/availability";
import { useRequestResource } from "@/features/resources/queries";
import { slot } from "@/lib/format";
import type { Booking, Resource, Team } from "@/lib/types";

const toLocalInput = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

type Props = {
  orgId: string;
  resource: Resource;
  teams: Team[];
  bookings: Booking[];
  initial?: { start: Date; end: Date };
  onClose: () => void;
};

export function RequestSlotDialog({ orgId, resource, teams, bookings, initial, onClose }: Props) {
  const request = useRequestResource(orgId);
  const [form, setForm] = useState({
    team_public_id: teams[0]?.public_id ?? "",
    start: toLocalInput(initial?.start ?? new Date()),
    end: toLocalInput(initial?.end ?? addHours(new Date(), 2)),
    purpose: "",
  });

  const start = new Date(form.start);
  const end = new Date(form.end);
  const validDates = Number.isFinite(start.getTime()) && Number.isFinite(end.getTime());
  const startIso = validDates ? start.toISOString() : "";
  const endIso = validDates ? end.toISOString() : "";
  const clash = validDates ? findClash(bookings, resource.id, startIso, endIso) : undefined;
  const invalid = !validDates || start >= end || start < new Date();
  const outsideAvailability = validDates && !invalid && !fitsAvailability(resource.availability, start, end);
  const cannotSubmit = invalid || outsideAvailability || Boolean(clash) || !form.team_public_id || !form.purpose.trim();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await request.mutateAsync({
              resourceId: resource.id,
              body: {
                team_public_id: form.team_public_id,
                start_time: startIso,
                end_time: endIso,
                purpose: form.purpose,
              },
            });
            onClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>Request {resource.name}</DialogTitle>
            <DialogDescription>
              An organisation admin approves the slot before it is booked.
            </DialogDescription>
          </DialogHeader>

          <div className="border-l-2 border-primary/40 pl-2.5 text-xs text-muted-foreground">
            <p>
              Available in {localTimeZone()}: {summariseAvailabilityLocal(resource.availability, validDates ? start : new Date())}
            </p>
            <p className="data-mono">UTC schedule: {summariseAvailability(resource.availability)}</p>
          </div>

          <Field label="Team" htmlFor="request-team">
            <select
              id="request-team"
              className="select-field"
              value={form.team_public_id}
              onChange={(event) => setForm({ ...form, team_public_id: event.target.value })}
            >
              {teams.map((team) => (
                <option key={team.public_id} value={team.public_id}>{team.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" htmlFor="request-start" error={invalid ? "Must be before the end" : undefined}>
              <Input
                id="request-start"
                type="datetime-local"
                required
                value={form.start}
                onChange={(event) => setForm({ ...form, start: event.target.value })}
              />
            </Field>
            <Field label="To" htmlFor="request-end">
              <Input
                id="request-end"
                type="datetime-local"
                required
                value={form.end}
                onChange={(event) => setForm({ ...form, end: event.target.value })}
              />
            </Field>
          </div>

          {validDates && (
            <p className="data-mono text-xs text-muted-foreground">
              UTC: {startIso.replace("T", " ").slice(0, 16)}–{endIso.replace("T", " ").slice(0, 16)}
            </p>
          )}
          {outsideAvailability && (
            <p className="text-xs text-danger">
              Choose a slot entirely within the local availability shown above.
            </p>
          )}

          <Field label="Purpose" htmlFor="request-purpose">
            <Textarea
              id="request-purpose"
              rows={2}
              required
              value={form.purpose}
              onChange={(event) => setForm({ ...form, purpose: event.target.value })}
            />
          </Field>

          {clash && (
            <p className="flex items-start gap-2 border-l-2 border-warn bg-warn/5 py-1.5 pl-2.5 text-xs">
              <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0 text-warn" />
              <span>
                This resource is already reserved for {slot(clash.start_time, clash.end_time)}.
              </span>
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={cannotSubmit || request.isPending}>
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
