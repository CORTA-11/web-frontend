"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon, BuildingIcon, Clock3Icon, LockKeyholeIcon } from "lucide-react";
import { useUserOrgs } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DashboardOrgsSection({ orgId }: { orgId: string }) {
  const isMounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const { data: orgsPage, isPending, error } = useUserOrgs();
  if (!isMounted) return null;
  if (isPending) {
    return (
      <section className="flex flex-col gap-4">
        <h2>Your Organisations</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="p-6 flex flex-row items-center gap-4">
                <div className="size-10 bg-foreground animate-pulse" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-32 bg-foreground animate-pulse" />
                  <div className="h-3 w-16 bg-foreground animate-pulse" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <h2>Your Organisations</h2>
        <div className="border-3 border-border p-6 text-sm text-destructive">
          Failed to load organisations: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </section>
    );
  }
  const orgs = orgsPage?.items ?? [];
  if (orgs.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2>Your Organisations</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {orgs.map((org) => {
          const cardBody = (
            <CardHeader className="p-6 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center bg-foreground text-background">
                  <BuildingIcon className="size-5" />
                </div>
                <div className="flex flex-col min-w-0 gap-2">
                  <CardTitle className="text-lg font-extrabold truncate">{org.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {org.id === orgId ? "Active organisation" : org.lifecycle_state === "active" ? "Switch organisation" : "Unavailable"}
                  </CardDescription>
                  {org.lifecycle_state !== "active" && (
                    <Badge variant="secondary" className="w-fit">
                      <Clock3Icon />
                      {org.lifecycle_state.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" className="shrink-0 pointer-events-none" disabled={org.lifecycle_state !== "active"}>
                {org.lifecycle_state === "active" ? <ArrowRightIcon className="size-4 text-primary" /> : <LockKeyholeIcon className="size-4" />}
              </Button>
            </CardHeader>
          );
          return (
            <Card key={org.id} className={cn("border-border", org.id === orgId && "border-primary")}>
              {org.lifecycle_state === "active"
                ? <Link href={`/orgs/${org.id}`} className="block hover:underline underline-offset-4">{cardBody}</Link>
                : <div aria-disabled="true" className="block">{cardBody}</div>}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
