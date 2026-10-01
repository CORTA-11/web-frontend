"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMembers } from "@/features/teams/queries";
import { useContentAccessAction } from "@/features/content-access/queries";
import type { ContentKind } from "@/features/content-access/api";

export function GrantMember({ orgId, teamId, kind, resourceId, creatorId }: {
  orgId: string; teamId: string; kind: ContentKind; resourceId: string; creatorId: string;
}) {
  const members = useMembers(teamId, orgId);
  const mutation = useContentAccessAction(orgId, teamId);
  const [memberId, setMemberId] = useState("");
  return (
    <form className="flex items-end gap-2" onSubmit={(event) => {
      event.preventDefault();
      mutation.mutate({ action: "grant", kind, resourceId, memberId }, { onSuccess: () => setMemberId("") });
    }}>
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Give a member access
        <select className="select-field" value={memberId} onChange={(event) => setMemberId(event.target.value)} required>
          <option value="">{members.isError ? "Could not load members" : "Choose a member"}</option>
          {members.data?.filter((entry) => (entry.public_id ?? String(entry.user_id)) !== creatorId).map((entry) => (
            <option key={entry.user_id} value={entry.public_id ?? String(entry.user_id)}>{entry.name || entry.email || entry.public_id}</option>
          ))}
        </select>
      </label>
      <Button size="sm" type="submit" disabled={!memberId || mutation.isPending}>Grant access</Button>
    </form>
  );
}
