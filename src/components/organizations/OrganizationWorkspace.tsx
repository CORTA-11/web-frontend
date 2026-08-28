"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { organizationsApi } from "@/lib/api/organizations";
import { teamsApi } from "@/lib/api/teams";
import { ApiError, problemMessage } from "@/lib/api/client";
import type { CursorPage, Organization, Team } from "@/lib/types/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const emptyTeams: CursorPage<Team> = { items: [], next_cursor: null, previous_cursor: null };

function workspaceMessage(reason: unknown) {
  const prefix = reason instanceof ApiError && [403, 404].includes(reason.status)
    ? "This workspace is unavailable. " : "";
  return prefix + problemMessage(reason);
}

export function OrganizationWorkspace() {
  const { orgId } = useParams<{ orgId: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teams, setTeams] = useState(emptyTeams);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    try {
      const org = await organizationsApi.get(orgId);
      setOrganization(org);
      if (org.lifecycle_state !== "active") {
        setTeams(emptyTeams);
        setError(`This organization is ${org.lifecycle_state} and cannot be opened.`);
        return;
      }
      setTeams(await teamsApi.list(orgId, cursor));
      setError(null);
    } catch (reason) {
      setError(workspaceMessage(reason));
    } finally { setLoading(false); }
  }, [orgId]);

  useEffect(() => {
    void organizationsApi.get(orgId).then(async (org) => {
      setOrganization(org);
      if (org.lifecycle_state !== "active") {
        setError(`This organization is ${org.lifecycle_state} and cannot be opened.`);
        return;
      }
      setTeams(await teamsApi.list(orgId));
      setError(null);
    }).catch((reason) => setError(workspaceMessage(reason)))
      .finally(() => setLoading(false));
  }, [orgId]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await teamsApi.create(orgId, name);
      setName("");
      await load();
    } catch (reason) { setError(problemMessage(reason)); }
    finally { setCreating(false); }
  }

  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <header><p className="text-sm text-zinc-500">Organization workspace</p>
      <h1 className="text-2xl font-semibold">{organization?.name ?? "Organization"}</h1></header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <section className="rounded-xl border bg-white p-5 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between"><div>
        <h2 className="font-medium">Teams</h2><p className="text-sm text-zinc-500">Open a team board to manage its work.</p></div>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>Refresh</Button>
      </div>
      {loading ? <p className="text-sm text-zinc-500">Loading workspace…</p> :
        teams.items.length === 0 ? <p className="text-sm text-zinc-500">No teams found.</p> :
        <ul className="divide-y">{teams.items.map((team) => <li key={team.id} className="flex items-center justify-between py-4">
          <div><p className="font-medium">{team.name}</p><p className="text-xs text-zinc-500">{team.slug}</p></div>
          <Link href={`/orgs/${orgId}/teams/${team.id}/board`} className={cn(buttonVariants({ size: "sm" }))}>Open board</Link>
        </li>)}</ul>}
      <div className="mt-4 flex justify-between">
        <Button variant="outline" disabled={!teams.previous_cursor || loading} onClick={() => load(teams.previous_cursor)}>Previous</Button>
        <Button variant="outline" disabled={!teams.next_cursor || loading} onClick={() => load(teams.next_cursor)}>Next</Button>
      </div>
    </section>
    {organization?.lifecycle_state === "active" && <section className="rounded-xl border bg-white p-5 dark:bg-slate-900">
      <h2 className="font-medium">Create team</h2>
      <p className="text-sm text-zinc-500">If creation is restricted, the API will explain why.</p>
      <form onSubmit={create} className="mt-3 flex gap-2">
        <Input aria-label="Team name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Team name" disabled={creating} />
        <Button type="submit" disabled={creating || !name.trim()}>{creating ? "Creating…" : "Create"}</Button>
      </form>
    </section>}
  </div>;
}
