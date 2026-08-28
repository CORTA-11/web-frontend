"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/common/Field";
import { AvailabilityEditor } from "@/features/resources/components/AvailabilityEditor";
import { useCreateResource, useUpdateResource } from "@/features/resources/queries";
import type { AvailabilityWindow, Resource, ResourceKind } from "@/lib/types";

const KINDS: ResourceKind[] = ["gpu", "instrument", "room", "workstation"];


export function ResourceDialog({
  orgId, resource, onClose,
}: {
  orgId: string;
  resource: Resource | null;
  onClose: () => void;
}) {
  const create = useCreateResource(orgId);
  const update = useUpdateResource(orgId);
  const [form, setForm] = useState({
    name: resource?.name ?? "",
    code: resource?.code ?? "",
    kind: resource?.kind ?? ("instrument" as ResourceKind),
    location: resource?.location ?? "",
    enabled: resource?.enabled ?? true,
  });
  const [availability, setAvailability] = useState<AvailabilityWindow[]>(resource?.availability ?? []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = { ...form, availability };
    if (resource) await update.mutateAsync({ id: resource.id, body });
    else await create.mutateAsync(body);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{resource ? "Edit resource" : "New resource"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="resource-name">
              <Input
                id="resource-name"
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Code" htmlFor="resource-code" hint="Shown on the schedule.">
              <Input
                id="resource-code"
                required
                className="font-mono"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </Field>
            <Field label="Kind" htmlFor="resource-kind">
              <select
                id="resource-kind"
                className="select-field"
                value={form.kind}
                onChange={(event) => setForm({ ...form, kind: event.target.value as ResourceKind })}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </Field>
            <Field label="Location" htmlFor="resource-location">
              <Input
                id="resource-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
              />
            </Field>
          </div>

          <AvailabilityEditor value={availability} onChange={setAvailability} />

          <label className="flex items-center gap-2.5 text-sm">
            <Switch
              checked={form.enabled}
              onCheckedChange={(enabled) => setForm({ ...form, enabled })}
            />
            Open for booking
          </label>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
              {resource ? "Save resource" : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
