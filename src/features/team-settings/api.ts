import { api } from "@/lib/http";

export type TeamAISettings = { endpoint_url: string; model: string; has_api_token: boolean };
export type TeamAISettingsInput = { endpoint_url: string; model: string; api_token?: string };
const path = (orgId: string, teamId: string) => `/v1/orgs/${orgId}/teams/${teamId}/ai/settings`;

export const teamSettingsApi = {
  get: (orgId: string, teamId: string) => api<TeamAISettings>(path(orgId, teamId)),
  save: (orgId: string, teamId: string, json: TeamAISettingsInput) =>
    api<TeamAISettings>(path(orgId, teamId), { method: "PUT", json }),
};
