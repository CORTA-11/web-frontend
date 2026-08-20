"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { useOrgSettings } from "@/features/settings/queries";

export function Header() {
  const { orgId } = useParams<{ orgId: string }>();
  const org = useOrgSettings(orgId);
  const [open, setOpen] = useState(false);

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

      <div className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-medium">{org.data?.name ?? "Organisation"}</span>
        {org.data && <span className="data-mono hidden text-muted-foreground sm:inline">{org.data.public_id}</span>}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ProfileMenu />
      </div>
    </header>
  );
}
