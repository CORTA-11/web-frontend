"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { SendHorizonalIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatMessage, TeamMember } from "@/lib/types";

type Props = {
  members: TeamMember[];
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (message: string, mentions: number[]) => void;
  pending: boolean;
};

const TRAILING_MENTION = /@([\w-]*)$/;

export function Composer({ members, replyTo, onCancelReply, onSend, pending }: Props) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  const matches = query === null
    ? []
    : members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const update = (value: string) => {
    setText(value);
    const trailing = TRAILING_MENTION.exec(value.slice(0, field.current?.selectionStart ?? value.length));
    setQuery(trailing ? trailing[1] : null);
    setHighlight(0);
  };

  const insert = (member: TeamMember) => {
    setText((current) => current.replace(TRAILING_MENTION, `@${member.name} `));
    setQuery(null);
    field.current?.focus();
  };

  const submit = () => {
    const message = text.trim();
    if (!message) return;
    const mentions = members.filter((m) => message.includes(`@${m.name}`)).map((m) => m.user_id);
    onSend(message, mentions);
    setText("");
    setQuery(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (matches.length) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        return setHighlight((index) => (index + 1) % matches.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        return setHighlight((index) => (index - 1 + matches.length) % matches.length);
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        return insert(matches[highlight]);
      }
      if (event.key === "Escape") return setQuery(null);
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="relative border-t border-border pt-3">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 border-l-2 border-primary bg-muted/60 py-1 pl-2 text-xs">
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyTo.sender.name}</span>
            {": "}
            {replyTo.message}
          </span>
          <Button size="icon-xs" variant="ghost" aria-label="Cancel reply" onClick={onCancelReply}>
            <XIcon />
          </Button>
        </div>
      )}

      {matches.length > 0 && (
        <ul
          role="listbox"
          aria-label="Mention a team member"
          className="absolute bottom-full left-0 mb-1 w-64 border border-border bg-popover py-1 shadow-md"
        >
          {matches.map((member, index) => (
            <li key={member.user_id}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onClick={() => insert(member)}
                className={cn(
                  "flex w-full items-baseline gap-2 px-2 py-1 text-left text-sm",
                  index === highlight ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
              >
                {member.name}
                <span className="data-mono truncate text-muted-foreground">{member.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          ref={field}
          rows={2}
          value={text}
          onChange={(event) => update(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message. Use @ to mention someone, Enter to send."
          aria-label="Message"
          className="max-h-40 min-h-16 resize-none"
        />
        <Button size="icon" aria-label="Send message" disabled={pending || !text.trim()} onClick={submit}>
          <SendHorizonalIcon />
        </Button>
      </div>
    </div>
  );
}
