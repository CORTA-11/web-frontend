import { api } from "@/lib/http";
import type { AiSummary, ExtractedTask } from "@/lib/types";

export type ChatRange = { from?: string; to?: string };

export const aiApi = {
  chatSummary: (teamId: string, range: ChatRange) =>
    api<AiSummary>(`/teams/${teamId}/ai/chat-summary`, { method: "POST", json: range }),

  transcriptSummary: (teamId: string, body: { transcript: string; question?: string }) =>
    api<AiSummary>(`/teams/${teamId}/ai/transcript-summary`, { method: "POST", json: body }),

  extractTasks: (teamId: string, body: ChatRange & { transcript?: string }) =>
    api<{ tasks: ExtractedTask[] }>(`/teams/${teamId}/ai/extract-tasks`, { method: "POST", json: body }),
};
