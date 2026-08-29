"use client";

import Link from "next/link";
import { ArrowRightIcon, BuildingIcon } from "lucide-react";
import { useUserOrgs } from "@/features/auth/session";
import { RequireSession } from "@/features/auth/components/SessionGate";
import { Wordmark } from "@/components/layout/Wordmark";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/features/auth/components/CreateOrganizationDialog";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  member: "Member",
  ORG_ADMIN: "Administrator",
  ORG_MEMBER: "Member",
};

export default function OrgsPage() {
  return (
    <RequireSession>
      <div className="flex h-svh flex-col overflow-hidden bg-background">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
          <Wordmark />
          <span className="label-eyebrow border-l border-border pl-3">Organisations</span>
          <div className="ml-auto">
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-xl py-10 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-xl font-semibold tracking-tight">Your organisations</h1>
                <p className="text-sm text-muted-foreground">
                  Select an organisation or create one of your own.
                </p>
              </div>
              <CreateOrganizationDialog />
            </div>

            <OrgsList />
          </div>
        </main>
      </div>
    </RequireSession>
  );
}

function OrgsList() {
  const { data, isPending, error } = useUserOrgs();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <Card key={i} className="border-border">
            <CardHeader className="p-4 flex flex-row items-center gap-4">
              <div className="size-9 bg-muted rounded animate-pulse" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border p-4 text-sm text-destructive bg-destructive/10">
        Failed to load organisations: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Card className="border border-border">
        <CardHeader className="p-6 text-center">
          <CardTitle className="text-sm">No organisations yet</CardTitle>
          <CardDescription>Your account is ready. Create an organisation when you need one.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((org) => (
        <Card key={org.id} className="border-border hover:bg-muted/50 transition-colors">
          <Link href={`/orgs/${org.id}`} className="block">
            <CardHeader className="p-4 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex size-9 items-center justify-center border border-border bg-background">
                  <BuildingIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <CardTitle className="text-sm font-medium truncate">{org.name}</CardTitle>
                  <CardDescription className="text-xs truncate">
                    Role: {ROLE_LABEL[org.my_role] ?? org.my_role}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" className="shrink-0 pointer-events-none">
                <ArrowRightIcon className="size-4" />
              </Button>
            </CardHeader>
          </Link>
        </Card>
      ))}
    </div>
  );
}
