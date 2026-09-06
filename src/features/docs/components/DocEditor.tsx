"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorToolbar } from "@/features/docs/components/EditorToolbar";
import { useSaveDoc } from "@/features/docs/queries";
import { clock } from "@/lib/format";
import type { Doc } from "@/lib/types";
import "@/features/docs/editor.css";

const AUTOSAVE_MS = 1200;

/**
 * Autosave plus periodic pull. Real-time co-editing (SRS 3.1.8.5) needs document
 * rooms on socket-server; until then this is the documented degraded mode from
 * SRS 3.4.4.3 — edits persist, and other people's changes arrive on the next poll
 * whenever the local editor is clean.
 */
export function DocEditor({ orgId, teamId, doc }: { orgId: string; teamId: string; doc: Doc }) {
  const save = useSaveDoc(orgId, teamId, doc.id);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Start writing…" })],
    content: doc.content,
    editorProps: { attributes: { class: "doc-body min-h-96 outline-none" } },
    onUpdate: ({ editor }) => {
      dirty.current = true;
      clearTimeout(timer.current);
      const html = editor.getHTML();
      timer.current = setTimeout(() => {
        save.mutate(
          { content: html },
          {
            onSuccess: () => {
              dirty.current = false;
              setSavedAt(new Date().toISOString());
            },
          }
        );
      }, AUTOSAVE_MS);
    },
  });

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!editor || dirty.current || save.isPending) return;
    if (doc.content !== editor.getHTML()) editor.commands.setContent(doc.content, { emitUpdate: false });
  }, [doc.content, editor, save.isPending]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <p className="border-t border-border pt-2 text-xs text-muted-foreground" aria-live="polite">
        {save.isPending
          ? "Saving…"
          : savedAt
            ? `Saved at ${clock(savedAt)}`
            : `Last edited by ${doc.updated_by}`}
      </p>
    </div>
  );
}
