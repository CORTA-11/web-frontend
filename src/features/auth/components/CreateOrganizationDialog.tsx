"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusIcon } from "lucide-react";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateOrganization } from "@/features/auth/session";

const schema = z.object({ name: z.string().trim().min(2, "Give your organisation a name") });

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateOrganization();
  const { register, handleSubmit, formState, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />
        Create organisation
      </DialogTrigger>
      <DialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(async ({ name }) => {
            await create.mutateAsync(name.trim());
            reset();
            setOpen(false);
          })}
        >
          <DialogHeader>
            <DialogTitle>Create an organisation</DialogTitle>
            <DialogDescription>You will become the owner and can invite people after setup.</DialogDescription>
          </DialogHeader>
          <Field label="Organisation name" htmlFor="new-org-name" error={formState.errors.name?.message}>
            <Input id="new-org-name" autoFocus {...register("name")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create organisation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
