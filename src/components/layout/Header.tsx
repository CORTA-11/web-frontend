"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { BuildingIcon, ChevronDownIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { useOrgSettings } from "@/features/settings/queries";
import { useUserOrgs } from "@/features/auth/session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { orgId } = useParams<{ orgId: string }>();
  const org = useOrgSettings(orgId);
  const { data: orgsPage } = useUserOrgs();
  const [open, setOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const orgs = isMounted ? (orgsPage?.items ?? []) : [];

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation" className="lg:hidden" />}
        >
          <MenuIcon />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        {orgs.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-sm px-1 py-0.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 text-sm font-medium">
              <span className="truncate">{org.data?.name ?? "Organisation"}</span>
              <ChevronDownIcon className="size-3.5 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Switch organisation
              </div>
              {orgs.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  disabled={o.id === orgId}
                  render={<Link href={`/orgs/${o.id}`} />}
                  className="flex items-center gap-2"
                >
                  <BuildingIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{o.name}</span>
                  {o.id === orgId && <span className="size-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/orgs" />} className="flex items-center gap-2">
                <span className="truncate">View all organisations</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex min-w-0 items-baseline gap-2 px-1">
            <span className="truncate text-sm font-medium">{org.data?.name ?? "Organisation"}</span>
            {org.data?.public_id && (
              <span className="data-mono hidden text-muted-foreground sm:inline">{org.data.public_id}</span>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ProfileMenu />
      </div>
    </header>
  );
}
