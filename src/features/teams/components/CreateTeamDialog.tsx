"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/Field";
import { useCreateTeam, useOrgUsers } from "@/features/teams/queries";

const schema = z.object({
  name: z.string().min(2, "Give the team a name"),
  description: z.string().optional(),
  leader_user_id: z.coerce.number().int().positive("Pick a team leader"),
});

export function CreateTeamDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const users = useOrgUsers(orgId);
  const create = useCreateTeam(orgId);
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", leader_user_id: 0 },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        New team
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(async (values) => {
            await create.mutateAsync(values);
            reset();
            setOpen(false);
          })}
        >
          <DialogHeader>
            <DialogTitle>New team</DialogTitle>
            <DialogDescription>
              The leader you pick can add members and request resources.
            </DialogDescription>
          </DialogHeader>

          <Field label="Name" htmlFor="team-name" error={formState.errors.name?.message}>
            <Input id="team-name" autoFocus {...register("name")} />
          </Field>

          <Field label="Description" htmlFor="team-description">
            <Textarea id="team-description" rows={2} {...register("description")} />
          </Field>

          <Field label="Team leader" htmlFor="team-leader" error={formState.errors.leader_user_id?.message}>
            <select
              id="team-leader"
              className="select-field"
              {...register("leader_user_id")}
            >
              <option value={0}>Select a person…</option>
              {users.data?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
