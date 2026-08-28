"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/lib/types";


type Props = {
  members: TeamMember[];
  currentUserId?: number;
  assignee: number | null;
  onAssigneeChange: (value: number | null) => void;
  onNewTask: () => void;
};

export function BoardToolbar({ members, currentUserId, assignee, onAssigneeChange, onNewTask }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="assignee-filter" className="label-eyebrow">
        Assignee
      </label>
      <select
        id="assignee-filter"
        className="select-field select-field-sm w-auto"
        value={assignee ?? ""}
        onChange={(event) => onAssigneeChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">Everyone</option>
        {currentUserId && <option value={currentUserId}>Assigned to me</option>}
        {members
          .filter((member) => member.user_id !== currentUserId)
          .map((member) => (
            <option key={member.user_id} value={member.user_id}>
              {member.name}
            </option>
          ))}
      </select>
      <Button size="sm" className="ml-auto" onClick={onNewTask}>
        <PlusIcon />
        New task
      </Button>
    </div>
  );
}
