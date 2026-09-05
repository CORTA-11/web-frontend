"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { differenceInMinutes, isSameDay } from "date-fns";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { Composer } from "@/features/chat/components/Composer";
import { MessageItem } from "@/features/chat/components/MessageItem";
import { useChatHistory, useDeleteMessage, useSendMessage } from "@/features/chat/queries";
import { useChatSocket } from "@/features/chat/socket";
import { useMembers, useTeamContext } from "@/features/teams/queries";
import { day } from "@/lib/format";
import { isLive } from "@/lib/env";
import { can } from "@/lib/rbac";
import type { ChatMessage } from "@/lib/types";

const grouped = (message: ChatMessage, previous?: ChatMessage) =>
  Boolean(
    previous &&
      !previous.deleted_at &&
      previous.sender.id === message.sender.id &&
      differenceInMinutes(new Date(message.created_at), new Date(previous.created_at)) < 5
  );

export function ChatRoom({ teamId }: { teamId: string }) {
  const { orgId } = useParams<{ orgId: string }>();
  const history = useChatHistory(orgId, teamId);
  const members = useMembers(teamId, orgId);
  const { actor, user } = useTeamContext(teamId);
  const send = useSendMessage(orgId, teamId);
  const remove = useDeleteMessage(orgId, teamId);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const foot = useRef<HTMLDivElement>(null);

  useChatSocket(orgId, teamId);

  const count = history.data?.messages.length ?? 0;
  useEffect(() => {
    foot.current?.scrollIntoView({ block: "end" });
  }, [count]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <QueryBoundary query={history} rows={8}>
          {({ messages }) => (
            <>
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const newDay =
                  !previous || !isSameDay(new Date(previous.created_at), new Date(message.created_at));
                return (
                  <div key={message.id}>
                    {newDay && (
                      <p className="label-eyebrow sticky top-0 z-1 bg-background/90 py-2 backdrop-blur">
                        {day(message.created_at)}
                      </p>
                    )}
                    <MessageItem
                      message={message}
                      members={members.data ?? []}
                      repliedTo={messages.find((m) => m.id === message.reply_to_id)}
                      grouped={!newDay && grouped(message, previous)}
                      canDelete={
                        message.sender.id === user?.id || can(actor, "chat:delete_any")
                      }
                      onReply={setReplyTo}
                      onDelete={(id) => remove.mutate(id)}
                    />
                  </div>
                );
              })}
              <div ref={foot} />
            </>
          )}
        </QueryBoundary>
      </div>

      <Composer
        members={members.data ?? []}
        replyTo={replyTo}
        pending={send.isPending}
        onCancelReply={() => setReplyTo(null)}
        onSend={(message, mentions) => {
          const liveMentions = members.data
            ?.filter((member) => mentions.includes(member.user_id))
            .map((member) => member.public_id)
            .filter((id): id is string => Boolean(id));
          send.mutate({ message, mentions: isLive("chat") ? liveMentions : mentions, reply_to_id: replyTo?.id ?? null });
          setReplyTo(null);
        }}
      />
    </div>
  );
}
