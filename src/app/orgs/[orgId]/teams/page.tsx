"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, MessageSquare, Sparkles, Users } from "lucide-react";
import { teamsApi, type OrgUser, type Team } from "@/lib/api/teams";
import { useAuthStore } from "@/stores/auth-store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function OrgTeamsPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [teams, setTeams] = useState<Team[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [leaderUserId, setLeaderUserId] = useState("");
  const [creating, setCreating] = useState(false);

  const leaderCandidates = orgUsers.filter((u) => u.orgRole !== "ORG_ADMIN");

  const load = async () => {
    setLoading(true);
    const teamsRes = await teamsApi.list(orgId);
    if (!teamsRes.success) {
      setLoading(false);
      setError(teamsRes.error);
      return;
    }
    setTeams(teamsRes.data);

    if (isAdmin) {
      const usersRes = await teamsApi.listOrgUsers(orgId);
      if (usersRes.success) {
        setOrgUsers(usersRes.data);
        const candidates = usersRes.data.filter((u) => u.orgRole !== "ORG_ADMIN");
        if (!leaderUserId && candidates[0]) {
          setLeaderUserId(String(candidates[0].id));
        }
      }
    }
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, isAdmin]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    const result = await teamsApi.create(orgId, {
      name: trimmed,
      leaderUserId: leaderUserId ? Number(leaderUserId) : undefined,
    });
    setCreating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setName("");
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50 p-5 shadow-sm dark:border-fuchsia-900/40 dark:from-fuchsia-950/50 dark:via-violet-950/50 dark:to-sky-950/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
     
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Manage your org team workspace and jump into chat, board, or docs from one place.
              </p>
            </div>
          </div>
         
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Active teams</h2>
            <p className="text-sm text-zinc-500">Open a team for members, chat, and delivery work.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading teams…</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-zinc-500">No teams yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {teams.map((team) => {
              const inTeam = Boolean(team.myRole);
              return (
                <li key={team.publicId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    <p className="text-xs text-zinc-500">
                      {isAdmin ? "Admin-ready workspace" : team.myRole === "TEAM_LEADER" ? "You lead this team" : "You are part of this team"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/orgs/${orgId}/teams/${team.publicId}/members`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <Users className="size-4" />
                      Members
                    </Link>
                    {inTeam && (
                      <>
                        <Link href={`/orgs/${orgId}/teams/${team.publicId}/board`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          <BookOpen className="size-4" />
                          Board
                        </Link>
                        {!isAdmin && (
                          <Link href={`/orgs/${orgId}/teams/${team.publicId}/chat`} className={cn(buttonVariants({ size: "sm" }))}>
                            <MessageSquare className="size-4" />
                            Chat
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isAdmin && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold tracking-tight">Create team</h2>
          <p className="mt-1 text-sm text-zinc-500">Start a new team and appoint a leader instantly.</p>
          <form onSubmit={onCreate} className="mt-4 flex flex-wrap gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" disabled={creating} className="min-w-48 flex-1" />
            <select className="h-10 min-w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={leaderUserId} onChange={(e) => setLeaderUserId(e.target.value)} disabled={creating || leaderCandidates.length === 0}>
              <option value="">Assign leader…</option>
              {leaderCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <Button type="submit" disabled={creating || !name.trim() || !leaderUserId}>Create</Button>
          </form>
        </section>
      )}
    </div>
  );
}
