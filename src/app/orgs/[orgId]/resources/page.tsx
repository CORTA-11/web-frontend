"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";
import { resourcesApi } from "@/lib/api/resources";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Resource, ResourceRequest, ResourceType } from "@/lib/types/resource";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrgResourcesPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [resources, setResources] = useState<Resource[]>([]);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "gpu" as ResourceType,
    location: "",
  });
  const [requestForm, setRequestForm] = useState({
    resourceId: "",
    teamPublicId: "team-lab-alpha",
    startTime: "2026-08-15T09:00:00.000Z",
    endTime: "2026-08-15T13:00:00.000Z",
    purpose: "",
  });

  const load = async () => {
    setLoading(true);
    const [resourcesRes, requestsRes] = await Promise.all([
      resourcesApi.list(orgId),
      resourcesApi.listRequests(orgId),
    ]);
    setLoading(false);
    if (!resourcesRes.success) {
      setError(resourcesRes.error);
      return;
    }
    if (!requestsRes.success) {
      setError(requestsRes.error);
      return;
    }
    setResources(resourcesRes.data);
    setRequests(requestsRes.data);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, [orgId]);

  const onCreateResource = async (e: FormEvent) => {
    e.preventDefault();
    if (!resourceForm.name.trim() || !resourceForm.location.trim() || busy) return;
    setBusy(true);
    const result = await resourcesApi.create(orgId, resourceForm);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setResourceForm({ name: "", type: "gpu", location: "" });
    await load();
  };

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestForm.resourceId || !requestForm.purpose.trim() || busy) return;
    setBusy(true);
    const result = await resourcesApi.createRequest(orgId, requestForm.resourceId, {
      teamPublicId: requestForm.teamPublicId,
      startTime: requestForm.startTime,
      endTime: requestForm.endTime,
      purpose: requestForm.purpose,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setRequestForm((prev) => ({ ...prev, purpose: "" }));
    await load();
  };

  const onReview = async (request: ResourceRequest, status: "approved" | "rejected") => {
    setBusy(true);
    const result = await resourcesApi.reviewRequest(orgId, request.id, status);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  return (
    <div className="mx-auto min-h-full flex flex-col gap-6 max-w-6xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Resources</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Reserve hardware, rooms, and instruments with a polished resource dashboard.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              Add resource
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreateResource} className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
              <Input value={resourceForm.name} onChange={(e) => setResourceForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Resource name" disabled={busy} />
              <select className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={resourceForm.type} onChange={(e) => setResourceForm((prev) => ({ ...prev, type: e.target.value as ResourceType }))} disabled={busy}>
                <option value="gpu">GPU</option>
                <option value="sensor">Sensor</option>
                <option value="room">Room</option>
                <option value="workstation">Workstation</option>
              </select>
              <Input value={resourceForm.location} onChange={(e) => setResourceForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Location" disabled={busy} />
              <Button type="submit" disabled={busy || !resourceForm.name.trim() || !resourceForm.location.trim()}>Create</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle>Available resources</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading resources…</p>
          ) : resources.length === 0 ? (
            <p className="text-sm text-zinc-500">No resources registered yet.</p>
          ) : (
            resources.map((resource) => (
              <div key={resource.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{resource.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{resource.location}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${resource.enabled ? "bg-emerald-500/10 text-emerald-700" : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                    {resource.enabled ? "Available" : "Offline"}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{resource.type}</p>
                {resource.bookings.length ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Booked until {formatDate(resource.bookings[0].endTime)}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No bookings yet.</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Booking request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onRequest} className="grid gap-3 md:grid-cols-2">
            <select className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm" value={requestForm.resourceId} onChange={(e) => setRequestForm((prev) => ({ ...prev, resourceId: e.target.value }))} disabled={busy}>
              <option value="">Select resource…</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
            <Input value={requestForm.teamPublicId} onChange={(e) => setRequestForm((prev) => ({ ...prev, teamPublicId: e.target.value }))} placeholder="Team public id" disabled={busy} />
            <Input value={requestForm.startTime} onChange={(e) => setRequestForm((prev) => ({ ...prev, startTime: e.target.value }))} placeholder="Start time" disabled={busy} />
            <Input value={requestForm.endTime} onChange={(e) => setRequestForm((prev) => ({ ...prev, endTime: e.target.value }))} placeholder="End time" disabled={busy} />
            <textarea className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm md:col-span-2" value={requestForm.purpose} onChange={(e) => setRequestForm((prev) => ({ ...prev, purpose: e.target.value }))} placeholder="Purpose of the booking" disabled={busy} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy || !requestForm.resourceId || !requestForm.purpose.trim()}>Submit request</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocation requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <div>
                <p className="font-medium">{request.purpose}</p>
                <p className="text-sm text-zinc-500">{formatDate(request.startTime)} → {formatDate(request.endTime)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{request.status}</span>
                {isAdmin ? (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => void onReview(request, "approved")} disabled={busy}>Approve</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void onReview(request, "rejected")} disabled={busy}>Reject</Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
