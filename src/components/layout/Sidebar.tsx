"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayoutDashboard, Cpu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;

  const navItems = [
    {
      href: `/orgs/${orgId}`,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/orgs/${orgId}/resources`,
      label: "Resources",
      icon: Cpu,
      exact: false,
    },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-zinc-800">
        <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          C
        </div>
        <span className="text-sm font-semibold tracking-tight">CORTA</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
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
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
