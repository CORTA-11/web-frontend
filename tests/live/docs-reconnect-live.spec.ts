import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Locator,
  type Page,
  type Playwright,
} from "@playwright/test";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";

test("an Editor merges offline changes after reconnecting", async ({ browser, playwright }) => {
  const document = await createDocument(playwright);
  const offlineContext = await browser.newContext();
  const onlineContext = await browser.newContext();
  const offlinePage = await offlineContext.newPage();
  let releaseConnection = () => {};
  let socketRouted = false;
  const connectionGate = new Promise<void>((resolve) => {
    releaseConnection = resolve;
  });
  await offlinePage.routeWebSocket(/\/ws\/docs(?:\?|$)/, async (socket) => {
    socketRouted = true;
    await connectionGate;
    socket.connectToServer();
  });
  await signIn(offlinePage, ACCOUNTS.member);
  await offlinePage.goto(documentURL(document));
  await expect(offlinePage.getByText("Connecting", { exact: true })).toBeVisible();
  await expect.poll(() => socketRouted).toBeTruthy();
  releaseConnection();
  await expect(offlinePage.getByText("Synced", { exact: true })).toBeVisible();
  const offlineEditor = editorOn(offlinePage);
  const onlineEditor = await openEditor(onlineContext, document, ACCOUNTS.leader);

  await offlineContext.setOffline(true);
  await expect(offlineEditor.page.getByText(
    "Offline—changes will sync when reconnected",
    { exact: true },
  )).toBeVisible();

  await replaceText(offlineEditor.title, "Offline title");
  await offlineEditor.body.click();
  await offlineEditor.body.pressSequentially("Written offline");
  await onlineEditor.body.click();
  await onlineEditor.body.pressSequentially("Written remotely");
  await expect(offlineEditor.body).not.toContainText("Written remotely");

  await offlineContext.setOffline(false);
  await expect(offlineEditor.page.getByText("Connecting", { exact: true })).toBeVisible();
  await expect(offlineEditor.page.getByText("Synced", { exact: true })).toBeVisible();
  await expectConvergence(offlineEditor.title, onlineEditor.title, "Offline title");
  await expectConvergence(offlineEditor.body, onlineEditor.body, "Written offline");
  await expect(offlineEditor.body).toContainText("Written remotely");

  await offlineContext.setOffline(true);
  await expect(offlineEditor.page.getByText(
    "Offline—changes will sync when reconnected",
    { exact: true },
  )).toBeVisible();
  await offlineContext.setOffline(false);
  await expect(offlineEditor.page.getByText("Synced", { exact: true })).toBeVisible();

  await offlineContext.close();
  await onlineContext.close();
});

interface CreatedDocument {
  documentID: string;
  teamID: string;
}

interface AuthenticatedRequest {
  context: APIRequestContext;
  csrfToken: string;
}

interface OpenDocument {
  body: Locator;
  page: Page;
  title: Locator;
}

async function createDocument(playwright: Playwright): Promise<CreatedDocument> {
  const admin = await authenticatedRequest(playwright, ACCOUNTS.admin);
  const team = await admin.context.post(`/api/v1/orgs/${organizationID}/teams`, {
    data: { name: `Reconnect Document ${Date.now()}`, leader_email: ACCOUNTS.member },
    headers: { "X-CSRF-Token": admin.csrfToken },
  });
  expect(team.ok()).toBeTruthy();
  const { id: teamID } = (await team.json()) as { id: string };
  await admin.context.dispose();

  const member = await authenticatedRequest(playwright, ACCOUNTS.member);
  const added = await member.context.post(`/api/v1/orgs/${organizationID}/teams/${teamID}/members`, {
    data: { email: ACCOUNTS.leader },
    headers: { "X-CSRF-Token": member.csrfToken },
  });
  expect(added.ok()).toBeTruthy();
  const created = await member.context.post(`/api/v1/orgs/${organizationID}/teams/${teamID}/documents`, {
    data: { title: "Reconnect notes" },
    headers: { "X-CSRF-Token": member.csrfToken },
  });
  expect(created.ok()).toBeTruthy();
  const { id: documentID } = (await created.json()) as { id: string };
  await member.context.dispose();
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

async function openEditor(
  context: BrowserContext,
  document: CreatedDocument,
  email: string,
): Promise<OpenDocument> {
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(documentURL(document));
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  return editorOn(page);
}

function editorOn(page: Page): OpenDocument {
  return {
    body: page.locator(".doc-body"),
    page,
    title: page.getByLabel("Document title"),
  };
}

function documentURL(document: CreatedDocument) {
  return `/orgs/${organizationID}/teams/${document.teamID}/docs/${document.documentID}`;
}

async function replaceText(locator: Locator, value: string) {
  await locator.click();
  await locator.press("ControlOrMeta+A");
  await locator.pressSequentially(value);
}

async function expectConvergence(first: Locator, second: Locator, text: string) {
  await expect(first).toContainText(text);
  await expect(second).toContainText(text);
  await expect.poll(async () => (await first.innerText()) === (await second.innerText())).toBeTruthy();
}
