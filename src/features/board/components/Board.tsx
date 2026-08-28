"use client";

import { useState } from "react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor,
  closestCorners, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { BoardColumn } from "@/features/board/components/BoardColumn";
import { BoardToolbar } from "@/features/board/components/BoardToolbar";
import { TaskCard } from "@/features/board/components/TaskCard";
import { TaskDialog } from "@/features/board/components/TaskDialog";
import { useBoard, useMoveTask } from "@/features/board/queries";
import { planMove } from "@/features/board/move";
import { useMembers } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import type { Task } from "@/lib/types";

type Editing = { task: Task | null; column: string };

export function Board({ teamId, orgId }: { teamId: string; orgId: string }) {
  const board = useBoard(teamId, orgId);
  const members = useMembers(teamId);
  const move = useMoveTask(teamId);
  const { user } = useSession();
  const [assignee, setAssignee] = useState<number | null>(null);
  const [dragging, setDragging] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = ({ active }: DragStartEvent) =>
    setDragging(board.data?.tasks.find((task) => task.id === active.id) ?? null);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!board.data) return;
    const plan = planMove(board.data.tasks, String(active.id), over ? String(over.id) : null);
    if (plan) move.mutate({ taskId: String(active.id), patch: plan.patch, tasks: plan.tasks });
  };

  return (
    <QueryBoundary query={board} rows={6}>
      {(data) => (
        <>
          <BoardToolbar
            members={members.data ?? []}
            currentUserId={user?.id}
            assignee={assignee}
            onAssigneeChange={setAssignee}
            onNewTask={() => setEditing({ task: null, column: data.columns[0]?.id ?? "backlog" })}
          />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setDragging(null)}
          >
            <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
              {data.columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  members={members.data ?? []}
                  tasks={data.tasks.filter(
                    (task) =>
                      task.column_id === column.id &&
                      (assignee === null || task.assignee_id === assignee)
                  )}
                  onOpen={(task) => setEditing({ task, column: task.column_id })}
                  onAdd={(columnId) => setEditing({ task: null, column: columnId })}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {dragging && (
                <TaskCard
                  task={dragging}
                  dragging
                  member={members.data?.find((member) => member.user_id === dragging.assignee_id)}
                />
              )}
            </DragOverlay>
          </DndContext>

          {editing && (
            <TaskDialog
              teamId={teamId}
              orgId={orgId}
              columns={data.columns}
              members={members.data ?? []}
              task={editing.task}
              defaultColumn={editing.column}
              onClose={() => setEditing(null)}
            />
          )}
        </>
      )}
    </QueryBoundary>
  );
}
