import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import Text from "@tiptap/extension-text";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "@/features/docs/components/EditorToolbar";

type PresenceUser = { color: string; id: string; name: string; sessionId: string };
type Props = { document: HocuspocusProvider["document"]; provider: HocuspocusProvider; user: PresenceUser };
const TitleDocument = Document.extend({ content: "paragraph" });

export function CollaborativeEditors({ document, provider, user }: Props) {
  const caret = () => CollaborationCaret.configure({
    provider,
    user,
    render: renderCaret,
    selectionRender: renderSelection,
  });
  const titleEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      TitleDocument,
      Paragraph,
      Text,
      Collaboration.configure({ document, field: "title" }),
      caret(),
      Placeholder.configure({ placeholder: "Untitled document" }),
    ],
    editorProps: {
      attributes: { "aria-label": "Document title", class: "doc-title outline-none" },
      handleKeyDown: (_view, event) => event.key === "Enter",
    },
  });
  const bodyEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document, field: "body" }),
      caret(),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: { attributes: { class: "doc-body min-h-96 outline-none" } },
  });

  if (!titleEditor || !bodyEditor) return null;
  return (
    <>
      <EditorContent editor={titleEditor} />
      <EditorToolbar editor={bodyEditor} />
      <EditorContent editor={bodyEditor} />
    </>
  );
}

function renderCaret(user: Record<string, unknown>): HTMLElement {
  const caret = window.document.createElement("span");
  caret.className = "collaboration-caret";
  caret.dataset.userId = text(user.id);
  caret.dataset.sessionId = text(user.sessionId);
  caret.style.borderColor = text(user.color);
  const label = window.document.createElement("span");
  label.className = "collaboration-caret-label";
  label.style.backgroundColor = text(user.color);
  label.textContent = text(user.name);
  caret.append(label);
  return caret;
}

function renderSelection(user: Record<string, unknown>) {
  return {
    nodeName: "span",
    class: "collaboration-selection",
    style: `background-color: ${text(user.color)}70`,
    "data-user-id": text(user.id),
    "data-session-id": text(user.sessionId),
  };
}

const text = (value: unknown) => typeof value === "string" ? value : "";
