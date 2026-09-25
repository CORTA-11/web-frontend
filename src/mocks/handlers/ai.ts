import { actorFrom, teamRoleOf } from "@/mocks/session";
import { http, HttpResponse } from "msw";
import { db, now, uid } from "@/mocks/db";
import type { AiSummary, ExtractedTask, Priority } from "@/lib/types";

/**
 * Stand-in for the Context Service. It is deliberately a shallow heuristic over
 * the real text rather than canned prose, so the UI is exercised with output
 * that actually tracks the input.
 */
const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 24);

const DECISION = /\b(agreed|decided|decision|we will|moved to|confirmed)\b/i;
const ACTION = /\b(can you|i will|please|need to|re-?run|book|draft|prepare|rotate|fix|order|review)\b/i;

const summarise = (lines: string[], model: string, sourceCount: number): AiSummary => {
  const decisions = lines.filter((line) => DECISION.test(line)).slice(0, 4);
  const bullets = lines.filter((line) => !decisions.includes(line)).slice(0, 5);
  return {
    id: uid("sum"),
    headline: bullets[0] ?? "Nothing substantial in the selected range.",
    bullets,
    decisions,
    model,
    generated_at: now(),
    source_count: sourceCount,
  };
};

const priorityOf = (line: string): Priority =>
  /\b(urgent|blocker|before|today|tonight|tomorrow)\b/i.test(line) ? "high"
    : /\b(when|eventually|later|sometime)\b/i.test(line) ? "low"
      : "medium";

const assigneeOf = (line: string, teamId: string) =>
  db.members[teamId]?.find((m) => {
    const [first] = m.name.split(" ");
    return new RegExp(`\\b${first}\\b`, "i").test(line);
  })?.user_id ?? null;

const toTask = (line: string, teamId: string): ExtractedTask => {
  const title = line.replace(/^@\S+\s*/, "").replace(/\s+/g, " ").slice(0, 72);
  const offset = priorityOf(line) === "high" ? 2 : 7;
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: line,
    assignee_id: assigneeOf(line, teamId),
    priority: priorityOf(line),
    start_date: now(),
    due_date: new Date(Date.now() + offset * 864e5).toISOString(),
    evidence: line,
  };
};

const chatLines = (teamId: string, from?: string, to?: string) =>
  (db.chat[teamId] ?? [])
    .filter((m) => !m.deleted_at)
    .filter((m) => (!from || m.created_at >= from) && (!to || m.created_at <= to))
    .map((m) => `${m.sender.name}: ${m.message}`);

export const aiHandlers = [
  http.post("/api/v1/orgs/:orgId/teams/:teamId/ai/process", async ({ request, params }) => {
    const teamId = String(params.teamId);
    const actor = actorFrom(request);
    if (!actor || !teamRoleOf(teamId, actor.id) || !db.teams.some((team) => team.public_id === teamId && String(team.org_id) === String(params.orgId)))
      return new HttpResponse("You are not a member of this team", { status: 403 });
    const settings = db.teamAISettings[teamId];
    if (!settings) return new HttpResponse("Ask your team admin to configure AI in Team settings.", { status: 409 });
    const body = (await request.json()) as { from: string; to: string };
    if (!body.from || !body.to || !Number.isFinite(Date.parse(body.from)) || !Number.isFinite(Date.parse(body.to)) || body.from > body.to)
      return new HttpResponse("Choose a valid date range", { status: 400 });
    const messages = (db.chat[teamId] ?? [])
      .filter((message) => !message.deleted_at)
      .filter((message) => (!body.from || message.created_at >= body.from) && (!body.to || message.created_at <= body.to));
    if (!messages.length) return new HttpResponse("No messages in that date range", { status: 404 });
    if (messages.length > 100) return new HttpResponse("Choose a smaller date range (maximum 100 messages)", { status: 400 });
    const lines = messages.map((message) => `${message.sender.name}: ${message.message}`);
    const summary = summarise(lines, settings.model, messages.length);
    const decisions = summary.decisions.map((text) => ({
      text,
      source_message_ids: messages.filter((message) => text.includes(message.message)).map((message) => message.id),
    }));
    const actionItems = lines.filter((line) => ACTION.test(line)).slice(0, 10).map((line) => {
      const source = messages.find((message) => line.includes(message.message));
      const task = toTask(line, teamId);
      return {
        candidate_id: uid("candidate"),
        title: task.title,
        description: task.description,
        assignee_user_id: null,
        priority: task.priority,
        due_date: task.due_date?.slice(0, 10) ?? null,
        source_message_ids: source ? [source.id] : [],
        confidence: 0.8,
      };
    });
    return HttpResponse.json({
      schema_version: "1",
      request_id: uid("request"),
      summary: {
        overview: summary.headline,
        key_points: summary.bullets,
        decisions,
        open_questions: [],
      },
      action_items: actionItems,
    });
  }),

  http.post("/api/teams/:teamId/ai/chat-summary", async ({ request, params }) => {
    if (!db.settings.ai.enabled) return new HttpResponse("AI features are disabled for this organisation", { status: 403 });
    const { from, to } = (await request.json()) as { from?: string; to?: string };
    const lines = chatLines(String(params.teamId), from, to);
    if (!lines.length) return new HttpResponse("No messages in that date range", { status: 404 });
    return HttpResponse.json(summarise(lines, db.settings.ai.model, lines.length));
  }),

  http.post("/api/teams/:teamId/ai/transcript-summary", async ({ request }) => {
    if (!db.settings.ai.enabled) return new HttpResponse("AI features are disabled for this organisation", { status: 403 });
    const { transcript, question } = (await request.json()) as { transcript: string; question?: string };
    const lines = sentences(transcript);
    if (!lines.length) return new HttpResponse("The transcript is too short to summarise", { status: 400 });
    const focused = question
      ? lines.filter((line) => question.toLowerCase().split(/\s+/).some((word) => word.length > 3 && line.toLowerCase().includes(word)))
      : lines;
    return HttpResponse.json(summarise(focused.length ? focused : lines, db.settings.ai.model, lines.length));
  }),

  http.post("/api/teams/:teamId/ai/extract-tasks", async ({ request, params }) => {
    if (!db.settings.ai.enabled) return new HttpResponse("AI features are disabled for this organisation", { status: 403 });
    const teamId = String(params.teamId);
    const body = (await request.json()) as { transcript?: string; from?: string; to?: string };
    const lines = body.transcript ? sentences(body.transcript) : chatLines(teamId, body.from, body.to);
    const actions = lines.filter((line) => ACTION.test(line)).slice(0, 6);
    if (!actions.length) return new HttpResponse("No actionable items found in that source", { status: 404 });
    return HttpResponse.json({ tasks: actions.map((line) => toTask(line, teamId)) });
  }),
];
