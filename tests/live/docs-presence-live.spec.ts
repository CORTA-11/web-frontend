import {
  expect,
  test,
  type APIRequestContext,
  type BrowserContext,
  type Page,
  type Playwright,
} from "@playwright/test";
import { ACCOUNTS, signIn } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";
const memberID = "981a7340-2a25-4aac-8b49-fddf45ff4894";

test("authenticated Presence distinguishes Editing Sessions and cleans up", async ({ browser, playwright }) => {
  const document = await createDocument(playwright);
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const observerContext = await browser.newContext();
  const first = await openEditor(firstContext, document, ACCOUNTS.member);
  await openEditor(secondContext, document, ACCOUNTS.member);
  const observer = await openEditor(observerContext, document, ACCOUNTS.leader);
  const present = observer.getByRole("list", { name: "Editors present" });

  await expect(present.getByText("Demo Member", { exact: true })).toHaveCount(2);
  await expect(present.getByText("Demo Research Lead", { exact: true })).toHaveCount(1);

  const title = first.locator(".doc-title");
  await title.click();
  await title.press("End");
  await title.pressSequentially(" together");
  await expect(observer.locator(".doc-title")).toContainText("Presence notes together");
  await expect(observer.locator(`.doc-title .collaboration-caret[data-user-id="${memberID}"]`)).toBeVisible();

  await title.press("ControlOrMeta+A");
  await expect(observer.locator(`.doc-title .collaboration-selection[data-user-id="${memberID}"]`)).toBeVisible();

  const body = first.locator(".doc-body");
  await body.click();
  await body.pressSequentially("Presence marker");
  await expect(observer.locator(".doc-body")).toContainText("Presence marker");
  await expect(observer.locator(`.doc-body .collaboration-caret[data-user-id="${memberID}"]`)).toBeVisible();

  await body.press("ControlOrMeta+A");
  await expect(observer.locator(`.doc-body .collaboration-selection[data-user-id="${memberID}"]`)).toBeVisible();

  await firstContext.close();
  await expect(present.getByText("Demo Member", { exact: true })).toHaveCount(1);

  await secondContext.close();
  await observerContext.close();
});

type CreatedDocument = { documentID: string; teamID: string };

async function createDocument(playwright: Playwright): Promise<CreatedDocument> {
  const admin = await authenticatedRequest(playwright, ACCOUNTS.admin);
  const team = await admin.context.post(`/api/v1/orgs/${organizationID}/teams`, {
    data: { name: `Presence Document ${Date.now()}`, leader_email: ACCOUNTS.member },
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
    data: { title: "Presence notes" },
    headers: { "X-CSRF-Token": member.csrfToken },
  });
  expect(created.ok()).toBeTruthy();
  const { id: documentID } = (await created.json()) as { id: string };
  await member.context.dispose();
  return { documentID, teamID };
}

async function authenticatedRequest(playwright: Playwright, email: string) {
  const context = await playwright.request.newContext({
    baseURL: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3000" },
  });
  const login = await context.post("/api/v1/auth/login", {
    data: { email, password: "synodus-demo-password" },
  });
  expect(login.ok()).toBeTruthy();
  const { csrf_token: csrfToken } = (await login.json()) as { csrf_token: string };
  return { context, csrfToken } satisfies { context: APIRequestContext; csrfToken: string };
}

async function openEditor(context: BrowserContext, document: CreatedDocument, email: string): Promise<Page> {
  const page = await context.newPage();
  await signIn(page, email);
  await page.goto(`/orgs/${organizationID}/teams/${document.teamID}/docs/${document.documentID}`);
  await expect(page.getByText("Synced", { exact: true })).toBeVisible();
  return page;
}
