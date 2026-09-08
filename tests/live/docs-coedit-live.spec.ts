import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
  type Page,
  type Playwright,
} from "@playwright/test";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";

test("two Editors converge while Undo remains local", async ({ browser, playwright }) => {
  const document = await createDocument(playwright);
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await openEditor(
    firstContext.pages()[0] ?? await firstContext.newPage(), document, ACCOUNTS.member,
  );
  const second = await openEditor(
    secondContext.pages()[0] ?? await secondContext.newPage(), document, ACCOUNTS.leader,
  );

  await first.title.click();
  await first.title.press("ControlOrMeta+A");
  await first.title.pressSequentially("Shared title");
  await expect(second.title).toHaveText("Shared title");

  await Promise.all([
    first.title.press("Home").then(() => first.title.pressSequentially("Alpha ")),
    second.title.press("End").then(() => second.title.pressSequentially(" Beta")),
  ]);
  await expectConvergence(first.title, second.title, /Alpha/);
  await expect(first.title).toContainText("Beta");
  await Promise.all([
    first.title.press("Home").then(() => first.title.pressSequentially("One")),
    second.title.press("Home").then(() => second.title.pressSequentially("Two")),
  ]);
  await expectConvergence(first.title, second.title, /One/);
  await expect(first.title).toContainText("Two");

  await first.title.press("Enter");
  await first.title.press("ControlOrMeta+B");
  await first.title.pressSequentially(" plain");
  await expect(second.title).toContainText("plain");
  await expectHTMLConvergence(first.title, second.title);
  await expect(first.title.locator("p")).toHaveCount(1);
  await expect(second.title.locator("p")).toHaveCount(1);
  await expect(first.title.locator("strong")).toHaveCount(0);
  await expect(second.title.locator("strong")).toHaveCount(0);

  await Promise.all([
    first.body.click().then(() => first.body.pressSequentially("Alpha")),
    second.body.click().then(() => second.body.pressSequentially("Beta")),
  ]);
  await expectConvergence(first.body, second.body, /Alpha/);
  await expect(first.body).toContainText("Beta");
  await Promise.all([
    first.body.press("Home").then(() => first.body.pressSequentially("Start ")),
    second.body.press("End").then(() => second.body.pressSequentially(" End")),
  ]);
  await expectConvergence(first.body, second.body, /Start/);
  await expect(first.body).toContainText("End");

  await first.page.waitForTimeout(600);
  await second.body.click();
  await second.body.press("ControlOrMeta+A");
  await Promise.all([
    first.body.press("Home").then(() => first.body.pressSequentially("Gamma ")),
    second.page.getByRole("button", { name: "Bold" }).click(),
  ]);
  await expectHTMLConvergence(first.body, second.body);
  await expect(first.body.locator("strong")).not.toHaveCount(0);

  await first.body.press("ControlOrMeta+z");
  await expect(first.body).not.toContainText("Gamma");
  await expect(second.body).not.toContainText("Gamma");
  await expect(first.body).toContainText("Alpha");
  await expect(first.body).toContainText("Beta");
  await expect(first.body.locator("strong")).not.toHaveCount(0);
  await expectHTMLConvergence(first.body, second.body);
  await first.body.press("ControlOrMeta+Shift+z");
  await expectConvergence(first.body, second.body, /Gamma/);
  await expectHTMLConvergence(first.body, second.body);

  const expectedTitle = (await first.title.innerText()).replace(/\s+/g, " ").trim();
  const expectedBodyHTML = normalizeHTML(await first.body.innerHTML());
  await expect.poll(async () => {
    const response = await first.page.request.get(
      `/api/v1/orgs/${organizationID}/teams/${document.teamID}/documents/${document.documentID}`,
    );
    if (!response.ok()) return { bodyHTML: "", title: `status:${response.status()}` };
    const projection = (await response.json()) as { body_html: string; title: string };
    return {
      bodyHTML: normalizeHTML(projection.body_html),
      title: projection.title,
    };
  }, { timeout: 10_000 }).toMatchObject({
    bodyHTML: expectedBodyHTML,
    title: expectedTitle,
  });

  await firstContext.close();
  await secondContext.close();
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
    data: { name: `Concurrent Document ${Date.now()}`, leader_email: ACCOUNTS.member },
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
    data: { title: "Concurrent notes" },
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

async function openEditor(page: Page, document: CreatedDocument, email: string): Promise<OpenDocument> {
  await signIn(page, email);
  await page.goto(`/orgs/${organizationID}/teams/${document.teamID}/docs/${document.documentID}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  return {
    body: page.locator(".doc-body"),
    page,
    title: page.getByLabel("Document title"),
  };
}

async function expectConvergence(
  first: Locator,
  second: Locator,
  content: RegExp,
) {
  await expect(first).toContainText(content);
  await expect(second).toContainText(content);
  await expect.poll(async () => (await first.innerText()) === (await second.innerText())).toBeTruthy();
}

async function expectHTMLConvergence(first: Locator, second: Locator) {
  await expect.poll(async () => normalizeHTML(await first.innerHTML()) === normalizeHTML(await second.innerHTML()))
    .toBeTruthy();
}

const normalizeHTML = (value: string) => value.replace(/\s+/g, " ").trim();
