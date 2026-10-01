"use client";

import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  BoldIcon, CodeIcon, EraserIcon, FileCodeIcon, ItalicIcon, LinkIcon, ListIcon,
  ListOrderedIcon, QuoteIcon, Redo2Icon, SeparatorHorizontalIcon,
  StrikethroughIcon, UnderlineIcon, Undo2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorLinkDialog } from "@/features/docs/components/EditorLinkDialog";

type Props = { editor: Editor; textSize: number; onTextSizeChange: (size: number) => void };
const levels = [1, 2, 3] as const;
const textSizes = [14, 16, 18, 20, 24];

export function EditorToolbar({ editor, textSize, onTextSizeChange }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"), italic: current.isActive("italic"),
      underline: current.isActive("underline"), strike: current.isActive("strike"),
      code: current.isActive("code"), codeBlock: current.isActive("codeBlock"),
      bulletList: current.isActive("bulletList"), orderedList: current.isActive("orderedList"),
      blockquote: current.isActive("blockquote"), link: current.isActive("link"),
      heading: levels.find((level) => current.isActive("heading", { level })) ?? 0,
      canUndo: current.can().undo(), canRedo: current.can().redo(),
    }),
  });
  const actions = [
    { label: "Undo", icon: Undo2Icon, disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
    { label: "Redo", icon: Redo2Icon, disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() },
    { label: "Bold", icon: BoldIcon, active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", icon: ItalicIcon, active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Underline", icon: UnderlineIcon, active: state.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Strikethrough", icon: StrikethroughIcon, active: state.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: "Inline code", icon: CodeIcon, active: state.code, run: () => editor.chain().focus().toggleCode().run() },
    { label: "Code block", icon: FileCodeIcon, active: state.codeBlock, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "Bullet list", icon: ListIcon, active: state.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrderedIcon, active: state.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Quote", icon: QuoteIcon, active: state.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Link", icon: LinkIcon, active: state.link, run: () => setLinkOpen(true) },
    { label: "Insert divider", icon: SeparatorHorizontalIcon, run: () => editor.chain().focus().setHorizontalRule().run() },
    { label: "Clear formatting", icon: EraserIcon, run: () => editor.chain().focus().unsetAllMarks().clearNodes().run() },
  ];

  return (
    <>
      <div role="toolbar" aria-label="Document formatting" className="editor-toolbar flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Block format</span>
          <select aria-label="Block format" className="select-field select-field-sm w-32" value={state.heading ? `heading-${state.heading}` : "paragraph"}
            onChange={(event) => {
              if (event.target.value === "paragraph") editor.chain().focus().setParagraph().run();
              else {
                const level = levels.find((level) => `heading-${level}` === event.target.value);
                if (level) editor.chain().focus().setHeading({ level }).run();
              }
            }}>
            <option value="paragraph">Paragraph</option>
            {levels.map((level) => <option key={level} value={`heading-${level}`}>Heading {level}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {actions.map((action) => (
            <Button key={action.label} size="icon-sm" variant="ghost" type="button"
              aria-label={action.label} title={action.label} aria-pressed={action.active}
              disabled={action.disabled} onMouseDown={(event) => event.preventDefault()} onClick={action.run}>
              <action.icon />
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2" title="Changes your editor view, not the shared document formatting.">
          <span className="label-eyebrow">Text size</span>
          <select aria-label="Editor text size" className="select-field select-field-sm w-20" value={textSize}
            onChange={(event) => {
              const size = Number(event.target.value);
              if (textSizes.includes(size)) onTextSizeChange(size);
            }}>
            {textSizes.map((size) => <option key={size} value={size}>{size}px</option>)}
          </select>
        </label>
      </div>
      {linkOpen && <EditorLinkDialog editor={editor} onClose={() => setLinkOpen(false)} />}
    </>
  );
}
