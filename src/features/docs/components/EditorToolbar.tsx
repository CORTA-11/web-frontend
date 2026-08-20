"use client";

import type { Editor } from "@tiptap/react";
import {
  BoldIcon, CodeIcon, Heading2Icon, ItalicIcon, ListIcon,
  ListOrderedIcon, QuoteIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorToolbar({ editor }: { editor: Editor }) {
  const marks = [
    { name: "bold", label: "Bold", icon: BoldIcon, run: () => editor.chain().focus().toggleBold().run() },
    { name: "italic", label: "Italic", icon: ItalicIcon, run: () => editor.chain().focus().toggleItalic().run() },
    { name: "code", label: "Inline code", icon: CodeIcon, run: () => editor.chain().focus().toggleCode().run() },
    { name: "heading", label: "Heading", icon: Heading2Icon, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: "bulletList", label: "Bullet list", icon: ListIcon, run: () => editor.chain().focus().toggleBulletList().run() },
    { name: "orderedList", label: "Numbered list", icon: ListOrderedIcon, run: () => editor.chain().focus().toggleOrderedList().run() },
    { name: "blockquote", label: "Quote", icon: QuoteIcon, run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border pb-2">
      {marks.map((mark) => (
        <Button
          key={mark.name}
          size="icon-xs"
          variant={editor.isActive(mark.name) ? "secondary" : "ghost"}
          aria-label={mark.label}
          aria-pressed={editor.isActive(mark.name)}
          onClick={mark.run}
        >
          <mark.icon />
        </Button>
      ))}
    </div>
  );
}
