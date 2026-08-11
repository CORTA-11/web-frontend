"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, MessageSquare, Users } from "lucide-react";
import { teamsApi, type OrgUser, type Team } from "@/lib/api/teams";
import { useAuthStore } from "@/stores/auth-store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function OrgDashboardPage() {
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
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {isAdmin
            ? "Manage teams, assign leaders, and allocate members. Team chat is only for allocated members."
            : "Open a team you belong to in order to chat."}
        </p>
      </div>

      {!isAdmin && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Member lab
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Your assigned labs
              </h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Access your teams, review lab details, and jump into chat, docs, or boards with a single click.
            </p>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-zinc-500">Loading your labs…</p>
          ) : teams.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              You are not assigned to any lab yet. Ask your administrator to add you to a team so collaboration tools become available.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {teams.map((team) => (
                <div key={team.publicId} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{team.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {team.description ?? "Research lab workspace"}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {team.myRole === "TEAM_LEADER" ? "Leader" : "Member"}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/orgs/${orgId}/teams/${team.publicId}/chat`} className={cn(buttonVariants({ size: "sm" }))}>
                      <MessageSquare className="size-4" />
                      Chat
                    </Link>
                    <Link href={`/orgs/${orgId}/teams/${team.publicId}/docs`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <BookOpen className="size-4" />
                      Docs
                    </Link>
                    <Link href={`/orgs/${orgId}/teams/${team.publicId}/board`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      <BookOpen className="size-4" />
                      Board
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-medium tracking-tight">
          {isAdmin ? "Organization teams" : "Your teams"}
        </h2>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading teams…</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {isAdmin
              ? "No teams yet. Create one and assign a leader."
              : "You are not allocated to any team yet."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {teams.map((team) => {
              const inTeam = Boolean(team.myRole);
              return (
                <li
                  key={team.publicId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.name}</p>
                    <p className="text-xs text-zinc-500">
                      {isAdmin
                        ? "Admin: teams & membership settings"
                        : team.myRole === "TEAM_LEADER"
                          ? "You are team leader"
                          : team.myRole === "CONTRIBUTOR"
                            ? "You are a member"
                            : "You are not a member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orgs/${orgId}/teams/${team.publicId}/members`}
                      className={cn(
                        buttonVariants({
                          variant: isAdmin ? "default" : "outline",
                          size: "sm",
                        })
                      )}
                    >
                      <Users className="size-4" />
                      {isAdmin ? "Manage" : "Members"}
                    </Link>
                    {inTeam && (
                      <>
                        <Link
                          href={`/orgs/${orgId}/teams/${team.publicId}/board`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <BookOpen className="size-4" />
                          Board
                        </Link>
                        <Link
                          href={`/orgs/${orgId}/teams/${team.publicId}/docs`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <BookOpen className="size-4" />
                          Docs
                        </Link>
                        {!isAdmin && (
                          <Link
                            href={`/orgs/${orgId}/teams/${team.publicId}/chat`}
                            className={cn(buttonVariants({ size: "sm" }))}
                          >
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

        {isAdmin && (
          <form
            onSubmit={onCreate}
            className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
          >
            <h3 className="text-sm font-medium">Create team</h3>
            <div className="flex flex-wrap gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name"
                disabled={creating}
                className="min-w-48 flex-1"
              />
              <select
                className="h-8 min-w-52 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={leaderUserId}
                onChange={(e) => setLeaderUserId(e.target.value)}
                disabled={creating || leaderCandidates.length === 0}
              >
                <option value="">Assign leader…</option>
                {leaderCandidates.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                disabled={creating || !name.trim() || !leaderUserId}
              >
                Create
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
