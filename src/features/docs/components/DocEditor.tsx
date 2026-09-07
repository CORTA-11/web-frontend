"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Collaboration } from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Doc as YDoc } from "yjs";
import { docsApi } from "@/features/docs/api";
import { EditorToolbar } from "@/features/docs/components/EditorToolbar";
import { WS_URL } from "@/lib/env";
import type { Doc } from "@/lib/types";
import "@/features/docs/editor.css";

type Props = { orgId: string; teamId: string; doc: Doc };

export function DocEditor({ orgId, teamId, doc }: Props) {
  const [document] = useState(() => new YDoc());
  const [status, setStatus] = useState("Connecting");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document, field: "body" }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: { attributes: { class: "doc-body min-h-96 outline-none" } },
  });

  useEffect(() => {
    const base = WS_URL || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    const query = new URLSearchParams({ org_id: orgId, team_id: teamId });
    const provider = new HocuspocusProvider({
      document,
      name: `${orgId}:${teamId}:${doc.id}`,
      token: async () => (await docsApi.ticket(orgId, teamId, doc.id)).token,
      url: `${base.replace(/\/$/, "")}/ws/docs?${query}`,
      onConnect: () => setStatus("Connecting"),
      onSynced: ({ state }) => state && setStatus("Synced"),
      onDisconnect: () => setStatus("Offline—changes will sync when reconnected"),
      onAuthenticationFailed: () => setStatus("Offline—changes will sync when reconnected"),
    });
    return () => provider.destroy();
  }, [doc.id, document, orgId, teamId]);

  if (!editor) return null;
  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <p className="border-t border-border pt-2 text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
