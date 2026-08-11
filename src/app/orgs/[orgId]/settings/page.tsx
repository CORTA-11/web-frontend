"use client";

import { useParams } from "next/navigation";
import { Bell, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OrgSettingsPage() {
  const params = useParams<{ orgId: string }>();
  const user = useAuthStore((s) => s.user);

  const preferences = [
    { label: "Notifications", value: "Enabled", icon: Bell },
    { label: "Team access", value: "Managed", icon: Users },
    { label: "Approvals", value: "Mock workflow", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto min-h-full flex min-h-0 flex-1 flex-col gap-6 max-w-5xl">
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-lime-50 to-cyan-50 p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/50 dark:via-lime-950/50 dark:to-cyan-950/50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm dark:bg-zinc-900/70 dark:text-emerald-300">
              <Sparkles className="size-3.5" />
              Workspace settings
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Organization settings</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Review your workspace details and preferred collaboration behaviors.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-[56%]">
          <Card className="border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle>Workspace overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Organization</p>
                <p className="mt-2 font-semibold">Aratuwa Labs</p>
                <p className="text-sm text-zinc-500">Public ID: {params.orgId}</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Current role</p>
                <p className="mt-2 font-semibold">{user?.role === "admin" ? "Admin" : "Member"}</p>
                <p className="text-sm text-zinc-500">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-[44%]">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
            {preferences.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white p-2 shadow-sm dark:bg-zinc-950">
                    <Icon className="size-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{value}</span>
              </div>
            ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
