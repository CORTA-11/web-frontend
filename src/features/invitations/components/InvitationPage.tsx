"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BuildingIcon } from "lucide-react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useSession } from "@/features/auth/session";
import { invitationsApi } from "@/features/invitations/api";
import { Button } from "@/components/ui/button";
import { qk } from "@/lib/query-keys";
import { dateTime } from "@/lib/format";
import { errorMessage } from "@/lib/http";

export function InvitationPage() {
  const token = useSearchParams().get("token") ?? "";
  const invitePath = `/invite?token=${encodeURIComponent(token)}`;
  const { user, isPending: sessionPending } = useSession();
  const router = useRouter();
  const client = useQueryClient();
  const preview = useQuery({
    queryKey: ["invitation-preview", token],
    queryFn: () => invitationsApi.preview(token),
    enabled: token.length > 0,
    retry: false,
  });
  const accept = useMutation({
    mutationFn: () => invitationsApi.accept(token),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: qk.userOrgs });
      router.replace(`/orgs/${preview.data?.organization_id}`);
    },
  });
  const decline = useMutation({
    mutationFn: () => invitationsApi.decline(token),
    onSuccess: () => router.replace("/orgs"),
  });
  const actionError = accept.error ?? decline.error;

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex size-10 items-center justify-center border border-border"><BuildingIcon className="size-5 text-muted-foreground" /></div>
        {preview.isPending || sessionPending ? <p className="text-sm text-muted-foreground">Loading invitation…</p> : preview.isError || !preview.data ? (
          <><h1 className="text-lg font-semibold">Invitation unavailable</h1><p className="text-sm text-muted-foreground">{preview.error ? errorMessage(preview.error) : "This invitation link is invalid or has expired."}</p></>
        ) : (
          <>
            <div className="flex flex-col gap-1"><h1 className="text-lg font-semibold">Join {preview.data.organization_name}</h1><p className="text-xs text-muted-foreground">This invitation expires {dateTime(preview.data.expires_at)}.</p></div>
            {user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm">Accept as <span className="font-medium">{user.email}</span>.</p>
                {actionError && <p role="alert" className="border-l-2 border-danger pl-2.5 text-xs text-danger">{errorMessage(actionError)}</p>}
                <div className="flex gap-2"><Button disabled={accept.isPending || decline.isPending} onClick={() => accept.mutate()}>Accept invitation</Button><Button variant="ghost" disabled={accept.isPending || decline.isPending} onClick={() => decline.mutate()}>Decline</Button></div>
              </div>
            ) : (
              <div className="flex flex-col gap-3"><p className="text-sm text-muted-foreground">Sign in or create an account with the invited email address to continue.</p><div className="flex gap-2"><Button render={<Link href={`/login?next=${encodeURIComponent(invitePath)}`} />}>Sign in</Button><Button variant="outline" render={<Link href={`/register?next=${encodeURIComponent(invitePath)}`} />}>Create account</Button></div></div>
            )}
          </>
        )}
      </div>
    </AuthShell>
  );
}
