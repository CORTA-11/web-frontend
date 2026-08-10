"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Reply, Trash2 } from "lucide-react";
import { chatApi, type ChatMessage } from "@/lib/api/chat";
import { teamsApi, type Team } from "@/lib/api/teams";
import { connectTeamChatWs } from "@/lib/ws/chat";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TeamChatPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const orgId = params.orgId;
  const teamId = params.teamId;
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isOrgAdmin = user?.role === "admin";

  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef(new Set<string>());

  const isLeader = team?.myRole === "TEAM_LEADER";
  const myUserId = user ? Number(user.id) : null;

  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  const upsertMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) {
        return prev.map((m) => (m.id === msg.id ? msg : m));
      }
      seenIds.current.add(msg.id);
      return [...prev, msg];
    });
  }, []);

  const markDeleted = useCallback((id: string, deletedAt?: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, message: "", deletedAt: deletedAt ?? new Date().toISOString() }
          : m
      )
    );
  }, []);

  useEffect(() => {
    if (isOrgAdmin) {
      setLoading(false);
      setError("Organization admins manage teams and members only — team chat is unavailable.");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const [teamRes, msgsRes] = await Promise.all([
        teamsApi.get(teamId),
        chatApi.list(teamId, { limit: 50 }),
      ]);
      if (cancelled) return;
      if (!teamRes.success) {
        setError(teamRes.error);
        setLoading(false);
        return;
      }
      if (!msgsRes.success) {
        setError(msgsRes.error);
        setLoading(false);
        return;
      }
      setTeam(teamRes.data);
      seenIds.current = new Set(msgsRes.data.map((m) => m.id));
      setMessages(msgsRes.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, isOrgAdmin]);

  useEffect(() => {
    if (isOrgAdmin || !accessToken || !teamId) return;
    const disconnect = connectTeamChatWs(teamId, (event) => {
      if (event.type === "message.created") {
        const raw = event.data as {
          id: string;
          channel_id: string;
          sender: { id: number; name: string; avatar_url?: string };
          reply_to_id?: string;
          message: string;
          created_at: string;
          deleted_at?: string;
        };
        if (!raw?.id) return;
        if (seenIds.current.has(raw.id)) return;
        upsertMessage({
          id: raw.id,
          channelId: raw.channel_id,
          sender: {
            id: raw.sender.id,
            name: raw.sender.name,
            avatarUrl: raw.sender.avatar_url,
          },
          replyToId: raw.reply_to_id,
          message: raw.message,
          createdAt: raw.created_at,
          deletedAt: raw.deleted_at,
        });
        return;
      }
      if (event.type === "message.deleted") {
        const raw = event.data as { id: string; deleted_at?: string };
        if (raw?.id) markDeleted(raw.id, raw.deleted_at);
      }
    });
    return disconnect;
  }, [isOrgAdmin, accessToken, teamId, upsertMessage, markDeleted]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const loadOlder = async () => {
    if (loadingOlder || messages.length === 0) return;
    const oldest = messages[0];
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const result = await chatApi.list(teamId, { limit: 50, before: oldest.id });
    setLoadingOlder(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.data.length === 0) return;
    setMessages((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      const merged = [
        ...result.data.filter((m) => !existing.has(m.id)),
        ...prev,
      ];
      for (const m of result.data) seenIds.current.add(m.id);
      return merged;
    });
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    const result = await chatApi.send(teamId, {
      message: text,
      replyToId: replyTo?.id,
    });
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    seenIds.current.add(result.data.id);
    upsertMessage(result.data);
    setDraft("");
    setReplyTo(null);
  };

  const onDelete = async (msg: ChatMessage) => {
    const result = await chatApi.remove(teamId, msg.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    markDeleted(msg.id, result.data.deletedAt);
  };

  return (
    <div className="-m-8 flex h-[calc(100vh-3.5rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link
          href={`/orgs/${orgId}`}
          className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold tracking-tight">
            {team?.name ?? "Team chat"}
          </h1>
          <p className="text-xs text-zinc-500">#general</p>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-6 py-4"
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Loading messages…</p>
        ) : (
          <>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loadingOlder}
                onClick={loadOlder}
              >
                {loadingOlder ? "Loading…" : "Load older messages"}
              </Button>
            </div>
            {messages.map((msg) => {
              const mine = myUserId != null && msg.sender.id === myUserId;
              const canDelete =
                !msg.deletedAt && (mine || isLeader);
              const parent = msg.replyToId
                ? messageById.get(msg.replyToId)
                : undefined;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group flex gap-3 rounded-lg px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
                    msg.deletedAt && "opacity-60"
                  )}
                >
                  <Avatar size="sm">
                    <AvatarFallback>{initials(msg.sender.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium">
                        {msg.sender.name}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    {parent && !parent.deletedAt && (
                      <div className="mt-1 border-l-2 border-zinc-300 pl-2 text-xs text-zinc-500 dark:border-zinc-600">
                        Reply to {parent.sender.name}: {parent.message}
                      </div>
                    )}
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-100">
                      {msg.deletedAt ? (
                        <em className="text-zinc-400">Message deleted</em>
                      ) : (
                        msg.message
                      )}
                    </p>
                  </div>
                  {!msg.deletedAt && (
                    <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setReplyTo(msg)}
                        aria-label="Reply"
                      >
                        <Reply />
                      </Button>
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(msg)}
                          aria-label="Delete"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <footer className="border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
        {error && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-2 text-xs dark:bg-zinc-800">
            <span className="truncate">
              Replying to <strong>{replyTo.sender.name}</strong>:{" "}
              {replyTo.message}
            </span>
            <button
              type="button"
              className="ml-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        )}
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
