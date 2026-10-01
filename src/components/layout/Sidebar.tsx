"use client";

import { useParams } from "next/navigation";
import {
  ArrowLeftIcon, BoxesIcon, CalendarClockIcon, FilesIcon, FileTextIcon,
  InboxIcon, LayoutGridIcon, MessagesSquareIcon, SettingsIcon, UsersIcon, UsersRoundIcon,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";
import { Wordmark } from "@/components/layout/Wordmark";
import { useTeams } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";
import { useAiInbox } from "@/features/ai/useAiInbox";
import { GuidedTour } from "@/features/guided-tour/components/GuidedTour";
import { tourSteps } from "@/features/guided-tour/steps";

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
  const inbox = useAiInbox();
  const isAdmin = can(user && { orgRole: user.org_role }, "org:manage");
  // Route context changes the navigation, never the membership requirement.
  const myTeams = teams.data?.filter((team) => team.my_role) ?? [];
  const activeTeam = myTeams.find((team) => team.public_id === teamId);
  const base = `/orgs/${orgId}`;
  const teamBase = `${base}/teams/${teamId}`;
  const unread = inbox.items.filter((item) => item.orgId === orgId && item.teamId === teamId && item.status === "ready" && !item.read).length;

  return (
    <nav
      className="flex h-full flex-col gap-6 overflow-y-auto py-6"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) onNavigate?.();
      }}
      aria-label="Main"
    >
      <div className="px-5"><Wordmark /></div>
      {teamId ? (
        <>
          <NavItem href={base} label="Back to organisation" icon={ArrowLeftIcon} exact />
          <section className="flex flex-col gap-0.5">
            <div data-tour="workspace" className="flex min-w-0 flex-col gap-2 px-5 pb-4">
              <p className="label-eyebrow">Team</p>
              <p className="break-words text-lg font-extrabold">
                {activeTeam?.name ?? (teams.isPending ? "Loading team…" : "Team workspace")}
              </p>
            </div>
            {activeTeam ? (
              <>
                {TEAM_SECTIONS.map((section) => (
                  <NavItem key={section.slug} href={`${teamBase}/${section.slug}`}
                    label={section.label} icon={section.icon} />
                ))}
                <NavItem href={`${teamBase}/ai-inbox`} label="AI inbox" icon={InboxIcon}
                  trailing={unread || undefined} />
                {can(user && { orgRole: user.org_role, teamRole: activeTeam.my_role }, "team:settings") && (
                  <NavItem href={`${teamBase}/settings`} label="Team settings" icon={SettingsIcon} />
                )}
              </>
            ) : !teams.isPending && (
              <p className="px-5 text-xs text-muted-foreground">This workspace is available to team members only.</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-0.5">
            <p data-tour="workspace" className="label-eyebrow px-5 pb-3">Organisation</p>
            <NavItem href={base} label="Overview" icon={BoxesIcon} exact />
            <NavItem href={`${base}/teams`} label="Teams" icon={UsersRoundIcon} exact />
            <NavItem href={`${base}/resources`} label="Resources" icon={CalendarClockIcon} />
            {isAdmin && <NavItem href={`${base}/users`} label="People" icon={UsersIcon} />}
            {isAdmin && <NavItem href={`${base}/settings`} label="Settings" icon={SettingsIcon} />}
          </section>
          <section className="flex flex-col gap-0.5">
            <p className="label-eyebrow px-5 pb-3">Teams</p>
            {teams.data && !myTeams.length && (
              <p className="px-5 text-xs text-muted-foreground">You are not in a team yet.</p>
            )}
            {myTeams.map((team) => (
              <NavItem key={team.public_id} href={`${base}/teams/${team.public_id}/board`}
                label={team.name} trailing={team.member_count || undefined} />
            ))}
          </section>
        </>
      )}
      <div className="mt-auto shrink-0 border-t border-sidebar-border pt-4">
        <GuidedTour key={`${orgId}:${teamId ?? "organisation"}`} disabled={teams.isPending || teams.isError} steps={tourSteps({
          team: Boolean(teamId),
          member: Boolean(activeTeam),
          hasTeams: myTeams.length > 0,
          orgAdmin: isAdmin,
          teamSettings: can(user && { orgRole: user.org_role, teamRole: activeTeam?.my_role }, "team:settings"),
        })} />
      </div>
    </nav>
  );
}
