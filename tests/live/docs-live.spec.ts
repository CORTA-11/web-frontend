import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";
const organizationSchema = "org_30ee71539b4845608cbf972587a60fda";

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
    data: { title: "Persisted projection" },
    headers: { "X-CSRF-Token": memberCSRF },
  });
  expect(created.ok()).toBeTruthy();
  const { id: documentID } = (await created.json()) as { id: string };
  await memberSetup.dispose();

  execFileSync("docker", [
    "compose", "-f", "../core-api/docker-compose.yaml", "--project-directory", "../core-api",
    "exec", "-T", "postgres", "sh", "-c",
    `psql -U "$(cat /run/secrets/db_admin_user)" -d appdb -v ON_ERROR_STOP=1 -c "UPDATE ${organizationSchema}.documents SET body_html = '<p>Persisted body</p>' WHERE public_id = '${documentID}'::uuid"`,
  ]);

  await signIn(page, ACCOUNTS.member);
  const firstProjection = page.waitForResponse(
    (response) => response.request().method() === "GET" && /\/api\/v1\/orgs\/[^/]+\/teams\/[^/]+\/documents\/[^/]+$/.test(response.url()),
  );
  await page.goto(`/orgs/${organizationID}/teams/${teamID}/docs/${documentID}`);
  const firstResponse = await firstProjection;
  expect(firstResponse.ok()).toBeTruthy();
  const firstBody = (await firstResponse.json()) as Record<string, unknown>;
  expect(firstBody).toMatchObject({ title: "Persisted projection", body_html: "<p>Persisted body</p>" });
  expect(firstBody).not.toHaveProperty("canonical_state");
  await expect(page.getByLabel("Document title")).toHaveValue("Persisted projection");
  await expect(page.locator(".doc-body")).toHaveText("Persisted body");

  const reloadedProjection = page.waitForResponse(
    (response) => response.request().method() === "GET" && response.url() === firstResponse.url(),
  );
  await page.reload();
  expect((await reloadedProjection).ok()).toBeTruthy();
  await expect(page.getByLabel("Document title")).toHaveValue("Persisted projection");
  await expect(page.locator(".doc-body")).toHaveText("Persisted body");
});
