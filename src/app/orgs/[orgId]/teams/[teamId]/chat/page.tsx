"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { chatApi, type ChatMessage } from "@/lib/api/chat";
import { teamsApi, type Team } from "@/lib/api/teams";
import { connectTeamChatWs } from "@/lib/ws/chat";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";



export default function TeamChatPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const { orgId, teamId } = params;
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isOrgAdmin = user?.role === "admin";

  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isLeader = team?.myRole === "TEAM_LEADER";
  const myUserId = user ? Number(user.id) : null;

  useEffect(() => {
    if (isOrgAdmin) return;

    teamsApi.get(teamId).then((res) => {
      if (res.success) setTeam(res.data);
    });

    chatApi.list(teamId).then((res) => {
      if (res.success) setMessages(res.data);
      setLoading(false);
    });
  }, [teamId, isOrgAdmin]);

  useEffect(() => {
    if (isOrgAdmin || !accessToken || !teamId) return;

    const disconnect = connectTeamChatWs(teamId, (event) => {
      if (event.type === "message.created") {
        const raw = event.data as {
          id: string;
          channel_id: string;
          sender: { id: number; name: string; avatar_url?: string };
          message: string;
          created_at: string;
        };
        if (!raw?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === raw.id)) return prev;
          return [
            ...prev,
            {
              id: raw.id,
              channelId: raw.channel_id,
              sender: {
                id: raw.sender.id,
                name: raw.sender.name,
                avatarUrl: raw.sender.avatar_url,
              },
              message: raw.message,
              createdAt: raw.created_at,
            },
          ];
        });
      } else if (event.type === "message.deleted") {
        const raw = event.data as { id: string; deleted_at?: string };
        if (raw?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === raw.id
                ? { ...m, message: "", deletedAt: raw.deleted_at || new Date().toISOString() }
                : m
            )
          );
        }
      }
    });

    return disconnect;
  }, [isOrgAdmin, accessToken, teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);

    const result = await chatApi.send(teamId, { message: text });
    setSending(false);
    if (result.success) {
      setMessages((prev) => [...prev, result.data]);
      setDraft("");
    } else {
      setError(result.error);
    }
  };

  const onDelete = async (msg: ChatMessage) => {
    const result = await chatApi.remove(teamId, msg.id);
    if (result.success) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, message: "", deletedAt: result.data.deletedAt || new Date().toISOString() }
            : m
        )
      );
    } else {
      setError(result.error);
    }
  };

  if (isOrgAdmin) {
    return (
      <div className="-m-8 flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-zinc-500 text-center">
        <p className="max-w-md text-sm">
          Organization admins manage teams and members only — team chat is unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="-m-8 flex h-[calc(100vh-3.5rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link
          href={`/orgs/${orgId}`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-base font-semibold">{team?.name ?? "Team chat"}</h1>
          <p className="text-xs text-zinc-500">#general</p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading messages…</p>
        ) : (
          <>
            {messages.map((msg) => {
              const mine = myUserId != null && msg.sender.id === myUserId;
              const canDelete = !msg.deletedAt && (mine || isLeader);
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group flex gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
                    msg.deletedAt && "opacity-60"
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {msg.sender.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-x-2">
                      <span className="text-sm font-medium">{msg.sender.name}</span>
                      <span className="text-xs text-zinc-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">
                      {msg.deletedAt ? <em className="text-zinc-400">Message deleted</em> : msg.message}
                    </p>
                  </div>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(msg)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <footer className="border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <form onSubmit={onSend} className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message #general"
            disabled={loading || sending}
            className="h-10"
          />
          <Button type="submit" disabled={loading || sending || !draft.trim()}>
            Send
          </Button>
        </form>
      </footer>
    </div>
  );
}
