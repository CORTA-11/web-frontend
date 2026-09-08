import { expect, test, type APIRequestContext, type Page, type Playwright } from "@playwright/test";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";

test("a Team Leader deleting an open Document closes every Editing Session", async ({ browser, playwright }) => {
  const document = await createDocument(playwright);
  const memberContext = await browser.newContext();
  const leaderContext = await browser.newContext();
  const memberPage = memberContext.pages()[0] ?? await memberContext.newPage();
  const leaderPage = leaderContext.pages()[0] ?? await leaderContext.newPage();
  await openEditor(memberPage, document, ACCOUNTS.member);
  await openEditor(leaderPage, document, ACCOUNTS.member);

  const ordinaryMember = await authenticatedRequest(playwright, ACCOUNTS.leader);
  const deniedDelete = await ordinaryMember.context.delete(
    `/api/v1/orgs/${organizationID}/teams/${document.teamID}/documents/${document.documentID}`,
    { headers: { "X-CSRF-Token": ordinaryMember.csrfToken } },
  );
  expect(deniedDelete.status()).toBe(403);

  await leaderPage.getByRole("button", { name: "Delete" }).click();

  await expect(memberPage).toHaveURL(`/orgs/${organizationID}/teams/${document.teamID}/docs`);
  await expect(leaderPage).toHaveURL(`/orgs/${organizationID}/teams/${document.teamID}/docs`);
  const directDelete = await ordinaryMember.context.delete(
    `/api/v1/orgs/${organizationID}/teams/${document.teamID}/documents/${document.documentID}`,
    { headers: { "X-CSRF-Token": ordinaryMember.csrfToken } },
  );
  expect(directDelete.status()).toBe(403);
  const ticket = await ordinaryMember.context.post(
    `/api/v1/orgs/${organizationID}/teams/${document.teamID}/documents/${document.documentID}/socket-ticket`,
    { headers: { "X-CSRF-Token": ordinaryMember.csrfToken } },
  );
  expect(ticket.status()).toBe(404);
  await leaderPage.reload();
  await expect(leaderPage.getByRole("link", { name: "Concurrent notes" })).toHaveCount(0);
  await ordinaryMember.context.dispose();
  await memberContext.close();
  await leaderContext.close();
});

interface CreatedDocument {
  documentID: string;
  teamID: string;
}

interface AuthenticatedRequest {
  context: APIRequestContext;
  csrfToken: string;
}

async function createDocument(playwright: Playwright): Promise<CreatedDocument> {
  const admin = await authenticatedRequest(playwright, ACCOUNTS.admin);
  const team = await admin.context.post(`/api/v1/orgs/${organizationID}/teams`, {
    data: { name: `Deletion Document ${Date.now()}`, leader_email: ACCOUNTS.member },
    headers: { "X-CSRF-Token": admin.csrfToken },
  });
  expect(team.ok()).toBeTruthy();
  const { id: teamID } = (await team.json()) as { id: string };
  await admin.context.dispose();

  const leader = await authenticatedRequest(playwright, ACCOUNTS.member);
  const added = await leader.context.post(`/api/v1/orgs/${organizationID}/teams/${teamID}/members`, {
    data: { email: ACCOUNTS.leader },
    headers: { "X-CSRF-Token": leader.csrfToken },
  });
  expect(added.ok()).toBeTruthy();
  const created = await leader.context.post(
    `/api/v1/orgs/${organizationID}/teams/${teamID}/documents`,
    {
      data: { title: "Concurrent notes" },
      headers: { "X-CSRF-Token": leader.csrfToken },
    },
  );
  expect(created.ok()).toBeTruthy();
  const { id: documentID } = (await created.json()) as { id: string };
  await leader.context.dispose();
  return { documentID, teamID };
}

async function authenticatedRequest(playwright: Playwright, email: string): Promise<AuthenticatedRequest> {
  const context = await playwright.request.newContext({
    baseURL: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3000" },
  });
  const login = await context.post("/api/v1/auth/login", {
    data: { email, password: "synodus-demo-password" },
  });
  expect(login.ok()).toBeTruthy();
  const { csrf_token: csrfToken } = (await login.json()) as { csrf_token: string };
  return { context, csrfToken };
}

async function openEditor(page: Page, document: CreatedDocument, email: string): Promise<void> {
  await signIn(page, email);
  await page.goto(`/orgs/${organizationID}/teams/${document.teamID}/docs/${document.documentID}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
}
