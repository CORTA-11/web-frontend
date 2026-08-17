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
  const { orgId } = params;
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
      setError(teamsRes.error);
      setLoading(false);
      return;
    }
    setTeams(teamsRes.data);

    if (isAdmin) {
      const usersRes = await teamsApi.listOrgUsers(orgId);
      if (usersRes.success) {
        setOrgUsers(usersRes.data);
        const candidates = usersRes.data.filter((u) => u.orgRole !== "ORG_ADMIN");
        if (candidates[0]) setLeaderUserId(String(candidates[0].id));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
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
    load();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">
          {isAdmin
            ? "Manage teams, assign leaders, and allocate members."
            : "Select a team you belong to in order to collaborate."}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Teams</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading teams…</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-zinc-500">No teams found.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {teams.map((team) => {
              const inTeam = Boolean(team.myRole);
              return (
                <li key={team.publicId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-zinc-500">
                      {isAdmin
                        ? "Administrator view"
                        : team.myRole === "TEAM_LEADER"
                        ? "You are team leader"
                        : team.myRole === "CONTRIBUTOR"
                        ? "Member"
                        : "Not a member"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orgs/${orgId}/teams/${team.publicId}/members`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <Users className="size-4" />
                      Members
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
                          href={`/orgs/${orgId}/teams/${team.publicId}/chat`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          <MessageSquare className="size-4" />
                          Chat
                        </Link>
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
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Create Team</h2>
          <form onSubmit={onCreate} className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name"
              disabled={creating}
              className="flex-1"
            />
            <select
              className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm dark:border-zinc-800"
              value={leaderUserId}
              onChange={(e) => setLeaderUserId(e.target.value)}
              disabled={creating || leaderCandidates.length === 0}
            >
              <option value="">Assign leader…</option>
              {leaderCandidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={creating || !name.trim() || !leaderUserId}>
              Create
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
