"use client";

import { useParams } from "next/navigation";
import {
  BoxesIcon, CalendarClockIcon, FilesIcon, FileTextIcon, LayoutGridIcon,
  MessagesSquareIcon, SettingsIcon, UsersIcon, UsersRoundIcon,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";
import { Wordmark } from "@/components/layout/Wordmark";
import { useTeams } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";

const TEAM_SECTIONS = [
  { slug: "board", label: "Board", icon: LayoutGridIcon },
  { slug: "chat", label: "Chat", icon: MessagesSquareIcon },
  { slug: "docs", label: "Documents", icon: FileTextIcon },
  { slug: "files", label: "Files", icon: FilesIcon },
  { slug: "members", label: "Members", icon: UsersRoundIcon },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId?: string }>();
  const { user } = useSession();
  const teams = useTeams(orgId);
  const isAdmin = can(user && { orgRole: user.org_role }, "org:manage");
  // Only teams you belong to are navigable; admins manage the rest from Teams.
  const myTeams = teams.data?.filter((team) => team.my_role) ?? [];
  const base = `/orgs/${orgId}`;

  return (
    <nav
      className="flex h-full flex-col gap-6 overflow-y-auto py-4"
      onClick={onNavigate}
      aria-label="Main"
    >
      <div className="px-4">
        <Wordmark />
      </div>

      <section className="flex flex-col gap-0.5">
        <p className="label-eyebrow px-4 pb-1">Organisation</p>
        <NavItem href={base} label="Overview" icon={BoxesIcon} exact />
        <NavItem href={`${base}/teams`} label="Teams" icon={UsersRoundIcon} exact />
        <NavItem href={`${base}/resources`} label="Resources" icon={CalendarClockIcon} />
        {isAdmin && <NavItem href={`${base}/users`} label="People" icon={UsersIcon} />}
        {isAdmin && <NavItem href={`${base}/settings`} label="Settings" icon={SettingsIcon} />}
      </section>

      <section className="flex flex-col gap-0.5">
        <p className="label-eyebrow px-4 pb-1">Teams</p>
        {teams.data && !myTeams.length && (
          <p className="px-4 text-xs text-muted-foreground">You are not in a team yet.</p>
        )}
        {myTeams.map((team) => (
          <div key={team.public_id} className="flex flex-col gap-0.5">
            <NavItem
              href={`${base}/teams/${team.public_id}/board`}
              match={`${base}/teams/${team.public_id}`}
              label={team.name}
              trailing={team.member_count || undefined}
            />
            {teamId === team.public_id &&
              TEAM_SECTIONS.map((section) => (
                <NavItem
                  key={section.slug}
                  href={`${base}/teams/${team.public_id}/${section.slug}`}
                  label={section.label}
                  icon={section.icon}
                  indent
                />
              ))}
          </div>
        ))}
      </section>
    </nav>
  );
}
