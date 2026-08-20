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
  onReply: (message: ChatMessage) => void;
  onDelete: (id: string) => void;
};

export function MessageItem({
  message, members, repliedTo, grouped, canDelete, onReply, onDelete,
}: Props) {
  if (message.deleted_at) {
    return (
      <p className="py-1 pl-11 text-xs text-muted-foreground italic">
        Message deleted
      </p>
    );
  }

  return (
    <article className={cn("group flex gap-3 px-1 py-0.5 hover:bg-muted/40", grouped ? "" : "mt-3")}>
      <div className="w-8 shrink-0 pt-0.5">
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

      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{message.sender.name}</span>
            <time dateTime={message.created_at} className="text-2xs text-muted-foreground">
              {time(message.created_at)}
            </time>
          </div>
        )}

        {repliedTo && (
          <p className="mb-0.5 truncate border-l-2 border-border pl-2 text-xs text-muted-foreground">
            <span className="font-medium">{repliedTo.sender.name}</span> {repliedTo.message}
          </p>
        )}

        <p className="text-sm break-words whitespace-pre-wrap">
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
