"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FilePlus2, Save, Trash2 } from "lucide-react";
import { documentsApi } from "@/lib/api/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Doc, DocSummary } from "@/lib/types/document";

export default function TeamDocsPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const orgId = params.orgId;
  const teamId = params.teamId;

  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [activeDoc, setActiveDoc] = useState<Doc | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    const result = await documentsApi.list(teamId);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDocs(result.data);
    if (!result.data.length) {
      setActiveDoc(null);
      setTitle("");
      setContent("");
      return;
    }
    if (!activeDoc || !result.data.some((doc) => doc.id === activeDoc.id)) {
      await openDoc(result.data[0].id);
    }
  };

  const openDoc = async (docId: string) => {
    const result = await documentsApi.get(teamId, docId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setActiveDoc(result.data);
    setTitle(result.data.title);
    setContent(result.data.content);
    setError(null);
  };

  useEffect(() => {
    void loadDocs();
  }, [teamId]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await documentsApi.create(teamId, { title: "New note" });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadDocs();
    await openDoc(result.data.id);
  };

  const onSave = async () => {
    if (!activeDoc) return;
    setBusy(true);
    const result = await documentsApi.update(teamId, activeDoc.id, {
      title,
      content,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setActiveDoc(result.data);
    await loadDocs();
  };

  const onDelete = async () => {
    if (!activeDoc) return;
    setBusy(true);
    const result = await documentsApi.remove(teamId, activeDoc.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadDocs();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href={`/orgs/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Team docs</h1>
            <p className="text-sm text-zinc-500">
              Draft notes and meeting minutes for the team workspace.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => void onCreate({ preventDefault() {} } as FormEvent)}>
          <FilePlus2 className="size-4" />
          New doc
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-zinc-500">Loading docs…</p>
            ) : docs.length === 0 ? (
              <p className="text-sm text-zinc-500">No docs yet.</p>
            ) : (
              docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => void openDoc(doc.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${activeDoc?.id === doc.id ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"}`}
                >
                  <p className="font-medium">{doc.title}</p>
                  <p className="mt-1 text-xs opacity-70">Updated {new Date(doc.updatedAt).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{activeDoc?.title ?? "Select a document"}</CardTitle>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onSave} disabled={busy || !activeDoc}>
                <Save className="size-4" />
                Save
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={busy || !activeDoc}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              disabled={busy}
            />
            <textarea
              className="min-h-72 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here"
              disabled={busy}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
