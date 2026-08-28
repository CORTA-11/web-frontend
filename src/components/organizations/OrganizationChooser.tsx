"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { organizationsApi } from "@/lib/api/organizations";
import { problemMessage } from "@/lib/api/client";
import type { CursorPage, Organization } from "@/lib/types/api";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const emptyPage: CursorPage<Organization> = {
  items: [], next_cursor: null, previous_cursor: null,
};

export function OrganizationChooser() {
  const [page, setPage] = useState(emptyPage);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    try {
      setPage(await organizationsApi.list(cursor));
      setError(null);
    } catch (reason) { setError(problemMessage(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void organizationsApi.list().then((result) => {
      setPage(result);
      setError(null);
    }).catch((reason) => setError(problemMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await organizationsApi.create(name);
      setName("");
      await load();
    } catch (reason) { setError(problemMessage(reason)); }
    finally { setCreating(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Organizations</h1>
            <p className="text-sm text-zinc-500">Choose an active workspace or create a new one.</p></div>
          <ProfileMenu />
        </header>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <section className="rounded-xl border bg-white p-5 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Your organizations</h2>
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
              <RefreshCw className="size-4" /> Refresh
            </Button>
          </div>
          {loading ? <p className="text-sm text-zinc-500">Loading organizations…</p> :
            page.items.length === 0 ? <p className="text-sm text-zinc-500">No organizations found.</p> :
            <ul className="divide-y">{page.items.map((org) => {
              const active = org.lifecycle_state === "active";
              return <li key={org.id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3"><Building2 className="size-5 shrink-0" />
                  <div><p className="truncate font-medium">{org.name}</p>
                    <p className="text-xs capitalize text-zinc-500">{org.lifecycle_state}</p></div></div>
                {active ? <Link className={cn(buttonVariants({ size: "sm" }))} href={`/orgs/${org.id}`}>Open</Link> :
                  <Button size="sm" disabled title="This organization is not active">Unavailable</Button>}
              </li>;
            })}</ul>}
          <div className="mt-4 flex justify-between">
            <Button variant="outline" disabled={!page.previous_cursor || loading} onClick={() => load(page.previous_cursor)}>Previous</Button>
            <Button variant="outline" disabled={!page.next_cursor || loading} onClick={() => load(page.next_cursor)}>Next</Button>
          </div>
        </section>
        <section className="rounded-xl border bg-white p-5 dark:bg-slate-900">
          <h2 className="font-medium">Create organization</h2>
          <form onSubmit={create} className="mt-3 flex gap-2">
            <Input aria-label="Organization name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Organization name" disabled={creating} />
            <Button type="submit" disabled={creating || !name.trim()}>{creating ? "Creating…" : "Create"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
