import { api } from "@/lib/http";
import type { AiProcessResponse, AiSummary, ExtractedTask } from "@/lib/types";

export type ChatRange = { from?: string; to?: string };

export const aiApi = {
  chatSummary: (orgId: string, teamId: string, body: Required<ChatRange>) =>
    api<AiProcessResponse | AiSummary>(
      `/v1/orgs/${orgId}/teams/${teamId}/ai/process`,
      { method: "POST", json: body },
    ),

  transcriptSummary: (teamId: string, body: { transcript: string; question?: string }) =>
    api<AiSummary>(`/teams/${teamId}/ai/transcript-summary`, { method: "POST", json: body }),

  extractTasks: (teamId: string, body: ChatRange & { transcript?: string }) =>
    api<{ tasks: ExtractedTask[] }>(`/teams/${teamId}/ai/extract-tasks`, { method: "POST", json: body }),
};
