"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CopyIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/common/Field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateInvitation } from "@/features/invitations/queries";

const schema = z.object({ email: z.email("Enter a valid email address") });

export function InviteMemberDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const create = useCreateInvitation(orgId);
  const { register, handleSubmit, formState, reset } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const close = () => { setOpen(false); setLink(""); reset(); };
  return (
    <Dialog open={open} onOpenChange={(value) => value ? setOpen(true) : close()}>
      <DialogTrigger render={<Button size="sm" />}><UserPlusIcon />Invite member</DialogTrigger>
      <DialogContent>
        {link ? (
          <div className="flex flex-col gap-4">
            <DialogHeader><DialogTitle>Invitation ready</DialogTitle><DialogDescription>Send this link to the invited email address. It is only shown once.</DialogDescription></DialogHeader>
            <div className="flex gap-2"><Input value={link} readOnly className="data-mono" /><Button type="button" size="icon" onClick={async () => { await navigator.clipboard.writeText(link); toast.success("Invitation link copied"); }}><CopyIcon /></Button></div>
            <DialogFooter><Button type="button" size="sm" onClick={close}>Done</Button></DialogFooter>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(async ({ email }) => {
            const invitation = await create.mutateAsync(email.trim());
            setLink(`${window.location.origin}/invite?token=${encodeURIComponent(invitation.token)}`);
          })}>
            <DialogHeader><DialogTitle>Invite a member</DialogTitle><DialogDescription>The invitation can only be accepted by an account using this email.</DialogDescription></DialogHeader>
            <Field label="Email" htmlFor="invite-email" error={formState.errors.email?.message}><Input id="invite-email" type="email" autoFocus {...register("email")} /></Field>
            <DialogFooter><Button type="button" variant="ghost" size="sm" onClick={close}>Cancel</Button><Button type="submit" size="sm" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create invite link"}</Button></DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
