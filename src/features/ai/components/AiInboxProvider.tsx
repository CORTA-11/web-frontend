"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiApi } from "@/features/ai/api";
import { useSession } from "@/features/auth/session";
import { errorMessage } from "@/lib/http";
import { loadInbox, saveInbox, type InboxItem } from "@/features/ai/inbox-store";
import { AiInboxContext } from "@/features/ai/inbox-context";

type Request = Pick<InboxItem, "id" | "orgId" | "teamId" | "from" | "to"> & { accountId: string };

export function AiInboxProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const accountId = user?.public_id ?? String(user?.id ?? "");
  return <AccountInbox key={accountId} accountId={accountId}>{children}</AccountInbox>;
}

function AccountInbox({ accountId, children }: { accountId: string; children: ReactNode }) {
  const [items, setItems] = useState<InboxItem[]>(() => accountId ? loadInbox(accountId) : []);

  useEffect(() => {
    if (accountId) saveInbox(accountId, items);
  }, [accountId, items]);

  const update = (id: string, changes: Partial<InboxItem>, owner = accountId) =>
    setItems((current) => accountId === owner
      ? current.map((item) => item.id === id ? { ...item, ...changes } : item)
      : current);

  const process = useMutation({
    mutationFn: (request: Request) => aiApi.chatSummary(request.orgId, request.teamId, {
      from: request.from,
      to: request.to,
    }),
    onSuccess: (result, request) => {
      update(request.id, { status: "ready", result }, request.accountId);
      if (request.accountId === accountId) toast.success("Chat summary is ready in your AI inbox");
    },
    onError: (error, request) => {
      update(request.id, { status: "error", error: errorMessage(error) }, request.accountId);
      if (request.accountId === accountId) toast.error("Chat summary failed. Open your AI inbox to retry.");
    },
  });

  const submit = (request: Omit<Request, "id" | "accountId">) => {
    if (!accountId) return;
    const id = crypto.randomUUID();
    const item: InboxItem = { ...request, id, createdAt: new Date().toISOString(), status: "pending", read: false, tasksAdded: false };
    setItems((current) => [item, ...current].slice(0, 30));
    process.mutate({ ...request, id, accountId });
  };

  return (
    <AiInboxContext.Provider value={{
      items,
      submit,
      markRead: (id) => update(id, { read: true }),
      markTasksAdded: (id) => update(id, { tasksAdded: true }),
      dismiss: (id) => setItems((current) => current.filter((item) => item.id !== id)),
    }}>
      {children}
    </AiInboxContext.Provider>
  );
}
