"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { membershipsApi } from "@/features/memberships/api";
import { problemMessage } from "@/lib/api/client";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/stores/auth-store";

const storageKey = "organization-invitation-token";

export function InvitationDecision() {
  const authReady = useAuthBootstrap();
  const user = useAuthStore((state) => state.user);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const incoming = new URLSearchParams(location.hash.slice(1)).get("token");
    if (incoming) sessionStorage.setItem(storageKey, incoming);
    history.replaceState(null, "", "/invite");
    const retained = incoming ?? sessionStorage.getItem(storageKey);
    queueMicrotask(() => setToken(retained));
  }, []);
  const preview = useQuery({ queryKey: ["invitation", token], queryFn: () => membershipsApi.preview(token!), enabled: Boolean(token), retry: false });
  const clear = () => { sessionStorage.removeItem(storageKey); setToken(null); };
  const accept = useMutation({ mutationFn: () => membershipsApi.accept(token!), onSuccess: clear });
  const decline = useMutation({ mutationFn: () => membershipsApi.decline(token!), onSuccess: clear });

  useEffect(() => {
    if (preview.isError) sessionStorage.removeItem(storageKey);
  }, [preview.isError]);

  if (!token) return <p>This invitation link is unavailable or has already been used.</p>;
  if (preview.isPending) return <p>Checking invitation…</p>;
  if (preview.isError) return <p role="alert">This invitation is invalid or has expired.</p>;
  return <div className="flex max-w-lg flex-col gap-4 border p-6">
    <h1 className="text-lg font-semibold">Join {preview.data.organization_name}</h1>
    <p>This invitation expires {new Date(preview.data.expires_at).toLocaleString()}. Sign in or register with the invited email before accepting.</p>
    <div className="flex gap-2"><Button disabled={!authReady || !user || accept.isPending} onClick={() => accept.mutate()}>Accept</Button><Button variant="outline" disabled={!authReady || !user || decline.isPending} onClick={() => decline.mutate()}>Decline</Button></div>
    {(accept.isError || decline.isError) && <p role="alert" className="text-danger">{problemMessage(accept.error ?? decline.error)}</p>}
    {!user && <p className="text-sm"><Link className="underline" href="/login?next=/invite">Sign in</Link> or <Link className="underline" href="/register?next=/invite">register</Link></p>}
  </div>;
}
