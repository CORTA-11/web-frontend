import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";
test("edits, formats, and reloads a collaborative Document body", async ({ page, playwright }) => {
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
    data: { name: `Collaborative Document ${Date.now()}`, leader_email: ACCOUNTS.member },
    headers: { "X-CSRF-Token": csrfToken },
  });
  expect(team.ok()).toBeTruthy();
  const { id: teamID } = (await team.json()) as { id: string };
  await setup.dispose();

  const memberSetup = await playwright.request.newContext({
    baseURL: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3000" },
  });
  const memberLogin = await memberSetup.post("/api/v1/auth/login", {
    data: { email: ACCOUNTS.member, password: "synodus-demo-password" },
  });
  expect(memberLogin.ok()).toBeTruthy();
  const { csrf_token: memberCSRF } = (await memberLogin.json()) as { csrf_token: string };
  const created = await memberSetup.post(`/api/v1/orgs/${organizationID}/teams/${teamID}/documents`, {
    data: { title: "Collaborative notes" },
    headers: { "X-CSRF-Token": memberCSRF },
  });
  expect(created.ok()).toBeTruthy();
  const { id: documentID } = (await created.json()) as { id: string };
  const other = await memberSetup.post(`/api/v1/orgs/${organizationID}/teams/${teamID}/documents`, {
    data: { title: "Other notes" },
    headers: { "X-CSRF-Token": memberCSRF },
  });
  expect(other.ok()).toBeTruthy();
  await memberSetup.dispose();

  await signIn(page, ACCOUNTS.member);
  const ticket = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().endsWith(`/${documentID}/socket-ticket`),
  );
  const bodyPatches: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH" && request.url().endsWith(`/${documentID}`)) {
      bodyPatches.push(request.postData() ?? "");
    }
  });
  await page.goto(`/orgs/${organizationID}/teams/${teamID}/docs/${documentID}`);
  expect((await ticket).ok()).toBeTruthy();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();

  const body = page.locator(".doc-body");
  await body.click();
  await page.keyboard.type("Persisted through collaboration");
  await page.keyboard.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(body.locator("strong")).toHaveText("Persisted through collaboration");
  await expect.poll(async () => {
    const response = await page.request.get(
      `/api/v1/orgs/${organizationID}/teams/${teamID}/documents/${documentID}`,
    );
    if (!response.ok()) return `status:${response.status()}`;
    const projection = (await response.json()) as { body_html: string };
    return projection.body_html;
  }, { timeout: 10_000 }).toContain("<strong>Persisted through collaboration</strong>");

  await page.getByRole("link", { name: "All documents" }).click();
  await page.getByRole("link", { name: "Other notes" }).click();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await expect(page.locator(".doc-body")).not.toContainText("Persisted through collaboration");
  await page.getByRole("link", { name: "All documents" }).click();
  await page.getByRole("link", { name: "Collaborative notes" }).click();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await expect(page.locator(".doc-body strong")).toHaveText("Persisted through collaboration");

  await page.reload();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await expect(page.locator(".doc-body strong")).toHaveText("Persisted through collaboration");

  execFileSync("docker", [
    "compose", "-f", "../core-api/docker-compose.yaml", "--project-directory", "../core-api",
    "restart", "collaboration-server",
  ]);
  await expect.poll(async () => {
    try {
      const response = await page.request.get("http://127.0.0.1:8082/health");
      return response.ok();
    } catch {
      return false;
    }
  }).toBeTruthy();
  await page.reload();
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  await expect(page.locator(".doc-body strong")).toHaveText("Persisted through collaboration");
  expect(bodyPatches.filter((payload) => payload.includes("body_html"))).toHaveLength(0);
});
