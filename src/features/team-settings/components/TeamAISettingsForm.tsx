"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { errorMessage } from "@/lib/http";
import { useTeamAISettings, useSaveTeamAISettings } from "../queries";

export function TeamAISettingsForm({ orgId, teamId }: { orgId: string; teamId: string }) {
  const settings = useTeamAISettings(orgId, teamId);
  const save = useSaveTeamAISettings(orgId, teamId);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [token, setToken] = useState("");
  return (
    <QueryBoundary query={settings}>
      {(data) => (
        <form className="max-w-xl space-y-4 rounded-md border p-5" onSubmit={(event) => {
          event.preventDefault();
          save.mutate({ endpoint_url: endpoint ?? data.endpoint_url, model: model ?? data.model, api_token: token },
            { onSuccess: () => { setToken(""); setEndpoint(null); setModel(null); } });
        }}>
          <h2 className="text-sm font-semibold">Chat summarisation</h2>
          <p className="text-sm text-muted-foreground">Summaries for this team use these settings. The saved API token is never displayed.</p>
          <fieldset disabled={save.isPending} className="space-y-4">
            <Field label="Endpoint" htmlFor="team-ai-endpoint">
              <Input id="team-ai-endpoint" type="url" required maxLength={2048} value={endpoint ?? data.endpoint_url}
                onChange={(event) => setEndpoint(event.target.value)} placeholder="https://example.com/v1/chat/completions" />
            </Field>
            <Field label="Model" htmlFor="team-ai-model">
              <Input id="team-ai-model" required maxLength={200} value={model ?? data.model} onChange={(event) => setModel(event.target.value)} />
            </Field>
            <Field label="API token" htmlFor="team-ai-token">
              <Input id="team-ai-token" type="password" autoComplete="new-password" required={!data.has_api_token} maxLength={8000}
                value={token} onChange={(event) => setToken(event.target.value)} />
            </Field>
            <p className="text-xs text-muted-foreground">{data.has_api_token ? "A token is saved. Leave blank to keep it, or enter a new token to replace it." : "Enter an API token to enable chat summarisation."}</p>
            <Button type="submit">{save.isPending ? "Saving…" : "Save settings"}</Button>
          </fieldset>
          {save.isError && <p role="alert" className="text-sm text-danger">{errorMessage(save.error)}</p>}
        </form>
      )}
    </QueryBoundary>
  );
}
