"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Collaboration } from "@tiptap/extension-collaboration";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
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
const TitleDocument = Document.extend({ content: "paragraph" });

export function DocEditor({ orgId, teamId, doc }: Props) {
  const [document] = useState(() => new YDoc());
  const [status, setStatus] = useState("Connecting");
  const titleEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      TitleDocument,
      Paragraph,
      Text,
      Collaboration.configure({ document, field: "title" }),
      Placeholder.configure({ placeholder: "Untitled document" }),
    ],
    editorProps: {
      attributes: {
        "aria-label": "Document title",
        class: "doc-title outline-none",
      },
      handleKeyDown: (_view, event) => event.key === "Enter",
    },
  });
  const bodyEditor = useEditor({
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

  if (!titleEditor || !bodyEditor) return null;
  return (
    <div className="flex flex-col gap-3">
      <EditorContent editor={titleEditor} />
      <EditorToolbar editor={bodyEditor} />
      <EditorContent editor={bodyEditor} />
      <p className="border-t border-border pt-2 text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
