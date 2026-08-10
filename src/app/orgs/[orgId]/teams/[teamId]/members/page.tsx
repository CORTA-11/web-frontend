"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import {
  teamsApi,
  type OrgUser,
  type Team,
  type TeamMember,
} from "@/lib/api/teams";
import { useAuthStore } from "@/stores/auth-store";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TeamMembersPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const router = useRouter();
  const orgId = params.orgId;
  const teamId = params.teamId;
  const user = useAuthStore((s) => s.user);
  const isOrgAdmin = user?.role === "admin";
  const myUserId = user ? Number(user.id) : null;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [addUserId, setAddUserId] = useState("");
  const [leaderUserId, setLeaderUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLeader = team?.myRole === "TEAM_LEADER";
  const canManageMembers = isOrgAdmin || isLeader;
  const canChat = Boolean(team?.myRole) && !isOrgAdmin;

  const memberIds = useMemo(
    () => new Set(members.map((m) => m.userId)),
    [members]
  );

  const addableUsers = orgUsers.filter(
    (u) => !memberIds.has(u.id) && u.orgRole !== "ORG_ADMIN"
  );
  const assignableLeaders = orgUsers.filter((u) => u.orgRole !== "ORG_ADMIN");

  const reload = useCallback(async () => {
    setError(null);
    const [teamRes, membersRes, usersRes] = await Promise.all([
      teamsApi.get(teamId),
      teamsApi.listMembers(teamId),
      teamsApi.listOrgUsers(orgId),
    ]);
    if (!teamRes.success) {
      setError(teamRes.error);
      return;
    }
    if (!membersRes.success) {
      setError(membersRes.error);
      return;
    }
    if (!usersRes.success) {
      setError(usersRes.error);
      return;
    }
    setTeam(teamRes.data);
    setMembers(membersRes.data);
    setOrgUsers(usersRes.data);
  }, [orgId, teamId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(addUserId);
    if (!id || busy) return;
    setBusy(true);
    const result = await teamsApi.addMember(teamId, id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAddUserId("");
    await reload();
  };

  const onAssignLeader = async (e: FormEvent) => {
    e.preventDefault();
    const id = Number(leaderUserId);
    if (!id || busy) return;
    setBusy(true);
    const result = await teamsApi.assignLeader(teamId, id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setLeaderUserId("");
    await reload();
  };

  const onRemove = async (userId: number) => {
    setBusy(true);
    const result = await teamsApi.removeMember(teamId, userId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await reload();
  };

  const onLeave = async () => {
    setBusy(true);
    const result = await teamsApi.leave(teamId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/orgs/${orgId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Link
          href={`/orgs/${orgId}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {team?.name ?? "Team members"}
            </h1>
            <p className="text-sm text-zinc-500">
              {isOrgAdmin
                ? "Assign leaders and allocate members. Org admins cannot open team chat."
                : "Only allocated members can use team chat."}
            </p>
          </div>
          {canChat && (
            <Link
              href={`/orgs/${orgId}/teams/${teamId}/chat`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <MessageSquare className="size-4" />
              Open chat
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Members</h2>
        <ul className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{m.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  {m.email} ·{" "}
                  {m.role === "TEAM_LEADER" ? "Team leader" : "Member"}
                </p>
              </div>
              {canManageMembers && m.userId !== myUserId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => onRemove(m.userId)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {canManageMembers && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Add member</h2>
          <p className="text-sm text-zinc-500">
            Choose a registered organization user who is not already on this
            team.
          </p>
          <form onSubmit={onAdd} className="flex flex-wrap gap-2">
            <select
              className="h-8 min-w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              disabled={busy || addableUsers.length === 0}
            >
              <option value="">Select user…</option>
              {addableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy || !addUserId}>
              Add
            </Button>
          </form>
        </section>
      )}

      {isOrgAdmin && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Assign team leader</h2>
          <p className="text-sm text-zinc-500">
            Organization admins can promote or add a registered user as team
            leader.
          </p>
          <form onSubmit={onAssignLeader} className="flex flex-wrap gap-2">
            <select
              className="h-8 min-w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={leaderUserId}
              onChange={(e) => setLeaderUserId(e.target.value)}
              disabled={busy}
            >
              <option value="">Select user…</option>
              {assignableLeaders.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy || !leaderUserId}>
              Assign leader
            </Button>
          </form>
        </section>
      )}

      {team?.myRole === "CONTRIBUTOR" && (
        <section>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onLeave}
          >
            Leave team
          </Button>
        </section>
      )}
    </div>
  );
}
