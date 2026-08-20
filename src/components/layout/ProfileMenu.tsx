"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BellIcon, LogOutIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout, useSession } from "@/features/auth/session";
import { initials } from "@/lib/format";

const ROLE_LABEL = { ORG_ADMIN: "Organisation admin", ORG_MEMBER: "Member" };

export function ProfileMenu() {
  const { user } = useSession();
  const { orgId } = useParams<{ orgId: string }>();
  const logout = useLogout();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-sm px-1 py-0.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <Avatar className="size-6">
          <AvatarFallback className="text-2xs">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm sm:inline">{user.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="data-mono text-muted-foreground">{user.email}</span>
          <span className="text-xs text-muted-foreground">
            {user.platform_role === "SUPER_ADMIN" ? "Platform operator" : ROLE_LABEL[user.org_role]}
          </span>
        </div>
        <DropdownMenuSeparator />
        {orgId && (
          <>
            <DropdownMenuItem render={<Link href={`/orgs/${orgId}/notifications`} />}>
              <BellIcon />
              Notification settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => logout.mutate()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
