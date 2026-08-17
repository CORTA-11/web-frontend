"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Cpu, MessageSquare, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const onTeamChat = pathname.includes("/teams/") && pathname.endsWith("/chat");
  const onTeamChatSection =
    pathname === `/orgs/${orgId}/teams` || onTeamChat;
  const onMembers =
    pathname.includes("/teams/") && pathname.endsWith("/members");
  const onBoard = pathname.includes("/teams/") && pathname.endsWith("/board");
  const onDocs = pathname.includes("/teams/") && pathname.endsWith("/docs");
  const onTeamsDirectory = pathname === `/orgs/${orgId}/teams`;
  const onSettings = pathname === `/orgs/${orgId}/settings`;

  const navItems: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact: boolean;
    forceActive?: boolean;
  }> = [
    {
      href: `/orgs/${orgId}`,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    ...(isAdmin
      ? [
          {
            href: `/orgs/${orgId}/teams`,
            label: "Teams",
            icon: Users,
            exact: true,
            forceActive: onTeamsDirectory || onMembers || onBoard || onDocs,
          },
        ]
      : [
          {
            href: `/orgs/${orgId}/teams`,
            label: "Team chat",
            icon: MessageSquare,
            exact: false,
            forceActive: onTeamChatSection,
          },
        ]),
    {
      href: `/orgs/${orgId}/resources`,
      label: "Resources",
      icon: Cpu,
      exact: false,
    },
  ];

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col md:border-r md:border-zinc-200 md:bg-white md:shadow-lg dark:md:border-slate-800 dark:md:bg-slate-950">
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-slate-800">

        <span className="text-sm font-semibold tracking-tight">CORTA</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon, exact, forceActive }) => {
          const active =
            forceActive ??
            (exact ? pathname === href : pathname.startsWith(href));

          return (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 text-white shadow-lg dark:from-slate-700 dark:via-slate-900 dark:to-slate-700"
                  : "text-zinc-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link
          href={`/orgs/${orgId}/settings`}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            onSettings
              ? "bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 text-white shadow-lg dark:from-slate-700 dark:via-slate-900 dark:to-slate-700"
              : "text-zinc-500 hover:bg-zinc-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
          )}
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
