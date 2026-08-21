"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadFiles } from "@/features/files/queries";
import { cn } from "@/lib/utils";

/** Wraps the file list so a drop anywhere on it uploads — SRS 3.1.6.1. */
export function UploadZone({
  teamId, orgId, children,
}: {
  teamId: string;
  orgId: string;
  children: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const upload = useUploadFiles(teamId, orgId);

  const accept = (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length) upload.mutate(list);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    accept(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={cn("flex flex-col gap-3 rounded-sm transition-colors", over && "bg-accent/50 outline-2 outline-dashed outline-primary/40")}
    >
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => input.current?.click()}>
          <UploadIcon />
          {upload.isPending ? "Encrypting…" : "Upload files"}
        </Button>
        <span className="text-xs text-muted-foreground">
          or drop them anywhere below — encrypted here before they leave the page
        </span>
        <input
          ref={input}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => {
            accept(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {children}
    </div>
  );
}
