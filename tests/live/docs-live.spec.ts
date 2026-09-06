import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";

test("creates, opens, and reloads a persisted Document projection", async ({ page, playwright }) => {
  const setup = await playwright.request.newContext({
    baseURL: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3000" },
  });
  const login = await setup.post("/api/v1/auth/login", {
    data: { email: ACCOUNTS.admin, password: "synodus-demo-password" },
  });
  expect(login.ok()).toBeTruthy();
  const { csrf_token: csrfToken } = (await login.json()) as { csrf_token: string };
  const team = await setup.post(`/api/v1/orgs/${organizationID}/teams`, {
    data: { name: `Document Projection ${Date.now()}`, leader_email: ACCOUNTS.member },
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(team.ok()).toBeTruthy();
  const { id: teamID } = (await team.json()) as { id: string };
  await setup.dispose();

  await signIn(page, ACCOUNTS.member);
  await page.goto(`/orgs/${organizationID}/teams/${teamID}/docs`);

  const firstProjection = page.waitForResponse(
    (response) => response.request().method() === "GET" && /\/api\/v1\/orgs\/[^/]+\/teams\/[^/]+\/documents\/[^/]+$/.test(response.url()),
  );
  await page.getByRole("button", { name: "New document" }).click();
  await expect(page).toHaveURL(/\/docs\/[0-9a-f-]{36}$/);
  const firstResponse = await firstProjection;
  expect(firstResponse.ok()).toBeTruthy();
  const firstBody = (await firstResponse.json()) as Record<string, unknown>;
  expect(firstBody).toMatchObject({ title: "Untitled document", body_html: "" });
  expect(firstBody).not.toHaveProperty("canonical_state");
  await expect(page.getByLabel("Document title")).toHaveValue("Untitled document");
  await expect(page.locator(".doc-body")).toBeVisible();

  const reloadedProjection = page.waitForResponse(
    (response) => response.request().method() === "GET" && response.url() === firstResponse.url(),
  );
  await page.reload();
  expect((await reloadedProjection).ok()).toBeTruthy();
  await expect(page.getByLabel("Document title")).toHaveValue("Untitled document");
  await expect(page.locator(".doc-body")).toBeVisible();
});
