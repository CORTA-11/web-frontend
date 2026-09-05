"use client";

import { ReplyIcon, Trash2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { renderMessage } from "@/features/chat/mentions";
import { initials, time } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, TeamMember } from "@/lib/types";

type Props = {
  message: ChatMessage;
  members: TeamMember[];
  repliedTo?: ChatMessage;
  grouped: boolean;
  canDelete: boolean;
  self: boolean;
  onReply: (message: ChatMessage) => void;
  onDelete: (id: string) => void;
};

export function MessageItem({
  message, members, repliedTo, grouped, canDelete, self, onReply, onDelete,
}: Props) {
  if (message.deleted_at) {
    return (
      <p
        className={cn(
          "py-1 text-xs text-muted-foreground italic",
          self ? "pr-11 text-right" : "pl-11"
        )}
      >
        Message deleted
      </p>
    );
  }

  return (
    <article
      className={cn(
        "group flex gap-3 px-1 py-0.5 hover:bg-muted/40",
        grouped ? "" : "mt-3",
        self && "flex-row-reverse"
      )}
    >
      <div className={cn("w-8 shrink-0 pt-0.5", self && "text-right")}>
        {grouped ? (
          <time
            dateTime={message.created_at}
            className="hidden text-2xs text-muted-foreground group-hover:block"
          >
            {time(message.created_at)}
          </time>
        ) : (
          <Avatar className="size-8">
            <AvatarFallback className="text-2xs">{initials(message.sender.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", self && "items-end")}>
        {!grouped && (
          <div className={cn("flex items-baseline gap-2", self && "flex-row-reverse")}>
            <span className="text-sm font-medium">{message.sender.name}</span>
            <time dateTime={message.created_at} className="text-2xs text-muted-foreground">
              {time(message.created_at)}
            </time>
          </div>
        )}

        {repliedTo && (
          <p
            className={cn(
              "mb-0.5 max-w-[82%] truncate border-border text-xs text-muted-foreground",
              self ? "border-r-2 pr-2 text-right" : "border-l-2 pl-2"
            )}
          >
            <span className="font-medium">{repliedTo.sender.name}</span> {repliedTo.message}
          </p>
        )}

        <p
          className={cn(
            "max-w-[82%] rounded-md px-3 py-2 text-sm break-words whitespace-pre-wrap",
            self ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"
          )}
        >
          {renderMessage(message.message, members, message.mentions)}
        </p>
      </div>

      <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Reply to ${message.sender.name}`}
          onClick={() => onReply(message)}
        >
          <ReplyIcon />
        </Button>
        {canDelete && (
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Delete message"
            onClick={() => onDelete(message.id)}
          >
            <Trash2Icon />
          </Button>
        )}
      </div>
    </article>
  );
}
