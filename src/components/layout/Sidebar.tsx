"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Users } from "lucide-react";
import { organizationsApi } from "@/lib/api/organizations";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { orgId } = useParams<{ orgId: string }>();
  const [role, setRole] = useState<"owner" | "administrator" | "member" | null>(null);
  useEffect(() => {
    let current = true;
    void organizationsApi.get(orgId).then((organization) => {
      if (current) setRole(organization.my_role);
    }).catch(() => { if (current) setRole(null); });
    return () => { current = false; };
  }, [orgId]);
  const canManagePeople = role === "owner" || role === "administrator";
  const organizationRoot = `/orgs/${orgId}`;
  const items = [
    { href: "/orgs", label: "Organizations", icon: Building2, active: pathname === "/orgs" },
    { href: organizationRoot, label: "Teams", icon: LayoutDashboard, active: pathname === organizationRoot || pathname.startsWith(`${organizationRoot}/teams`) },
    ...(canManagePeople ? [{ href: `${organizationRoot}/users`, label: "People", icon: Users, active: pathname === `${organizationRoot}/users` }] : []),
  ];
  return <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col md:border-r md:bg-white dark:md:bg-slate-950">
    <div className="flex h-14 items-center border-b px-5 text-sm font-semibold">CORTA</div>
    <nav className="flex flex-1 flex-col gap-1 p-3">{items.map(({ href, label, icon: Icon, active }) => {
      return <Link key={href} href={href} className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-slate-900 text-white" : "text-zinc-500 hover:bg-slate-100",
      )}><Icon className="size-4" />{label}</Link>;
    })}</nav>
  </aside>;
}
