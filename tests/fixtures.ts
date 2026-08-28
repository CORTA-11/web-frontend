import type { Page, Route } from "@playwright/test";

export const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "researcher@example.com",
  display_name: "Researcher",
};
export const session = {
  id: "44444444-4444-4444-8444-444444444444",
  created_at: "2026-08-27T09:00:00Z",
  last_seen_at: "2026-08-27T09:05:00Z",
  idle_expires_at: "2026-08-27T09:35:00Z",
  absolute_expires_at: "2026-08-27T21:00:00Z",
  current: true,
};
export const auth = { user, session, csrf_token: "csrf-test-token" };
export const org = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Applied Systems Lab",
  lifecycle_state: "active",
  created_at: "2026-08-27T09:00:00Z",
  updated_at: "2026-08-27T09:00:00Z",
  deleted_at: null,
};
export const team = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "Reproducibility Group",
  slug: "reproducibility-group",
  created_at: "2026-08-27T09:00:00Z",
  updated_at: "2026-08-27T09:00:00Z",
};

export function problem(status: number, detail: string) {
  return {
    type: status === 401 ? "/problems/unauthenticated" : "/problems/forbidden",
    title: "Request failed", status, detail,
    request_id: "55555555-5555-4555-8555-555555555555",
  };
}

export async function json(route: Route, body: unknown, status = 200) {
  await route.fulfill({ status, contentType: status >= 400 ? "application/problem+json" : "application/json", body: JSON.stringify(body) });
}

export async function sessionRoute(page: Page) {
  await page.route("**/api/v1/auth/session", async (route) => {
    if (route.request().method() === "GET") await json(route, auth);
    else await route.fulfill({ status: 204 });
  });
}
