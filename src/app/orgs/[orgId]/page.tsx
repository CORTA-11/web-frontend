"use client";

import { useAuthStore } from "@/stores/auth-store";

export default function OrgDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-zinc-500 dark:text-zinc-400">
        Welcome{user?.name ? `, ${user.name}` : ""}. Org modules (resources,
        teams, tasks) will be built here.
      </p>
    </div>
  );
}
