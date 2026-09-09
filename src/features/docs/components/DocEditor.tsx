"use client";

import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc as YDoc } from "yjs";
import { useSession } from "@/features/auth/session";
import { docsApi } from "@/features/docs/api";
import { CollaborativeEditors } from "@/features/docs/components/CollaborativeEditors";
import { PresenceList } from "@/features/docs/components/PresenceList";
import { presenceColor } from "@/features/docs/presence-color";
import { readPresence, type EditorPresence } from "@/features/docs/presence";
import { WS_URL } from "@/lib/env";
import type { Doc } from "@/lib/types";
import "@/features/docs/editor.css";

type Props = { orgId: string; teamId: string; doc: Doc; onDeleted: () => void };
const offlineStatus = "Offline—changes will sync when reconnected";

export function DocEditor({ orgId, teamId, doc, onDeleted }: Props) {
  const [document] = useState(() => new YDoc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [editors, setEditors] = useState<EditorPresence[]>([]);
  const [status, setStatus] = useState("Connecting");
  const { user } = useSession();
  const presenceID = user?.public_id ?? (user ? `mock-${user.id}` : null);

  useEffect(() => {
    if (!presenceID) return;
    const base = WS_URL || `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    const query = new URLSearchParams({ org_id: orgId, team_id: teamId });
    let active = true;
    const nextProvider = new HocuspocusProvider({
      document,
      name: `${orgId}:${teamId}:${doc.id}`,
      token: async () => (await docsApi.ticket(orgId, teamId, doc.id)).token,
      url: `${base.replace(/\/$/, "")}/ws/docs?${query}`,
      onConnect: () => setStatus("Connecting"),
      onSynced: ({ state }) => state && setStatus("Synced"),
      onDisconnect: () => setStatus(offlineStatus),
      onAuthenticationFailed: () => setStatus(offlineStatus),
      onAwarenessChange: ({ states }) => {
        setEditors(states.map(readPresence).filter((entry): entry is EditorPresence => entry !== null));
      },
      onStateless: ({ payload }) => {
        if (payload === JSON.stringify({ type: "document.deleted" })) {
          nextProvider.destroy();
          onDeleted();
        }
      },
    });
    queueMicrotask(() => {
      if (active) setProvider(nextProvider);
    });
    const offline = () => setStatus(offlineStatus);
    const online = () => setStatus(nextProvider.synced ? "Synced" : "Connecting");
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    return () => {
      active = false;
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      nextProvider.destroy();
    };
  }, [doc.id, document, onDeleted, orgId, presenceID, teamId]);

  return (
    <div className="flex flex-col gap-3">
      <PresenceList editors={editors} />
      {provider && user && presenceID && (
        <CollaborativeEditors
          document={document}
          provider={provider}
          user={{
            color: presenceColor(presenceID),
            id: presenceID,
            name: user.name,
            sessionId: provider.sessionId,
          }}
        />
      )}
      <p className="border-t border-border pt-2 text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
