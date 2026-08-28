import type { Task } from "@/lib/types";

/**
 * Works out the task order a drop produces. Returns the whole reordered list
 * for the optimistic cache write, plus the minimal patch the server needs.
 */
export function planMove(tasks: Task[], activeId: string, overId: string | null) {
  const active = tasks.find((task) => task.id === activeId);
  if (!active || !overId || activeId === overId) return null;

  const overTask = tasks.find((task) => task.id === overId);
  const columnId = overTask ? overTask.column_id : overId;
  const rest = tasks.filter((task) => task.id !== activeId);
  const target = overTask ? rest.findIndex((task) => task.id === overId) : rest.length;
  const next = [...rest.slice(0, target), { ...active, column_id: columnId }, ...rest.slice(target)];

  const position = next
    .filter((task) => task.column_id === columnId)
    .findIndex((task) => task.id === activeId);

  if (active.column_id === columnId && tasks.indexOf(active) === next.findIndex((t) => t.id === activeId)) {
    return null;
  }
  return { tasks: next, patch: { column_id: columnId, position } };
}
