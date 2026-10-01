"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = { editor: Editor; onClose: () => void };

export function EditorLinkDialog({ editor, onClose }: Props) {
  const current: unknown = editor.getAttributes("link").href;
  const [url, setUrl] = useState(typeof current === "string" ? current : "");
  const [error, setError] = useState<string>();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editor.isActive("link") ? "Edit link" : "Insert link"}</DialogTitle>
          <DialogDescription>Link the selected text to a web page or email address.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={(event) => {
          event.preventDefault();
          const href = url.trim();
          try {
            if (!["http:", "https:", "mailto:"].includes(new URL(href).protocol)) throw new Error("Unsupported protocol");
          } catch {
            setError("Use an http://, https:// or mailto: link.");
            return;
          }
          if (editor.chain().focus().extendMarkRange("link").setLink({ href }).run()) onClose();
        }}>
          <Field label="Link URL" htmlFor="document-link-url" error={error}>
            <Input id="document-link-url" type="url" required autoFocus value={url}
              placeholder="https://example.com" onChange={(event) => { setUrl(event.target.value); setError(undefined); }} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            {editor.isActive("link") && (
              <Button type="button" variant="outline" onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                onClose();
              }}>Remove link</Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Apply link</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
