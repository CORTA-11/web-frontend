"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { boardApi, type TaskDraft, type TaskMove } from "@/features/board/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { Board, Task } from "@/lib/types";

export const useBoard = (teamId: string, orgId: string) =>
  useQuery({ queryKey: qk.board(teamId), queryFn: () => boardApi.get(teamId, orgId) });

const reindex = (board: Board, tasks: Task[]): Board => ({
  columns: board.columns.map((column) => ({
    ...column,
    task_ids: tasks.filter((task) => task.column_id === column.id).map((task) => task.id),
  })),
  tasks,
});

export function useCreateTask(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (draft: TaskDraft) => boardApi.create(teamId, orgId, draft),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.board(teamId) }),
    onError: notifyError,
  });
}

export function useUpdateTask(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: TaskMove }) =>
      boardApi.update(teamId, orgId, taskId, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.board(teamId) }),
    onError: notifyError,
  });
}

/**
 * Drag and drop paints first and reconciles after: the board is rewritten in the
 * cache on drop, and the server response only matters if it disagrees.
 */
type MoveInput = { taskId: string; patch: TaskMove; tasks: Task[] };

export function useMoveTask(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, patch }: MoveInput) => boardApi.update(teamId, orgId, taskId, patch),
    onMutate: async ({ tasks }: MoveInput) => {
      await client.cancelQueries({ queryKey: qk.board(teamId) });
      const previous = client.getQueryData<Board>(qk.board(teamId));
      if (previous) client.setQueryData(qk.board(teamId), reindex(previous, tasks));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) client.setQueryData(qk.board(teamId), context.previous);
      notifyError(error);
    },
    onSettled: () => client.invalidateQueries({ queryKey: qk.board(teamId) }),
  });
}

export function useDeleteTask(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => boardApi.remove(teamId, orgId, taskId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.board(teamId) });
      toast.success("Task deleted");
    },
    onError: notifyError,
  });
}
