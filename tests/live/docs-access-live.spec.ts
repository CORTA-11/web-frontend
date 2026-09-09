import { HocuspocusProvider } from "@hocuspocus/provider";
import { expect, test, type APIRequestContext, type Playwright } from "@playwright/test";
import { ACCOUNTS } from "../helpers";

const organizationID = "30ee7153-9b48-4560-8cbf-972587a60fda";
const otherOrganizationID = "f1810095-f8a0-4e27-83df-d88b3256604d";

test("Document access stays inside the owning team", async ({ playwright }) => {
  const administrator = await authenticatedRequest(playwright, ACCOUNTS.admin);
  const owningTeamID = await createTeam(administrator, ACCOUNTS.member, "Release access");
  const otherTeamID = await createTeam(administrator, ACCOUNTS.leader, "Other release access");
  const teamMember = await authenticatedRequest(playwright, ACCOUNTS.member);
  const documentID = await createDocument(teamMember, owningTeamID);
  const documentPath = documentURL(organizationID, owningTeamID, documentID);

  await expectStatus(teamMember.context, documentPath, 200);
  await expectStatus(teamMember.context, `${documentPath}/socket-ticket`, 200, teamMember.csrfToken);
  await expectDocumentDenied(
    teamMember.context,
    documentURL(organizationID, otherTeamID, documentID),
    teamMember.csrfToken,
  );
  await expectDocumentDenied(
    teamMember.context,
    documentURL(otherOrganizationID, owningTeamID, documentID),
    teamMember.csrfToken,
  );
  await expectDocumentDenied(administrator.context, documentPath, administrator.csrfToken);

  const platformOperator = await authenticatedRequest(playwright, ACCOUNTS.platform);
  await expectDocumentDenied(platformOperator.context, documentPath, platformOperator.csrfToken);

  const unauthenticated = await playwright.request.newContext({ baseURL: apiBaseURL() });
  await expectStatus(unauthenticated, documentPath, 401);
  await expectStatus(unauthenticated, `${documentPath}/socket-ticket`, 401, "missing-session");

  await Promise.all([
    administrator.context.dispose(),
    teamMember.context.dispose(),
    platformOperator.context.dispose(),
    unauthenticated.dispose(),
  ]);
});

test("the public Document Room rejects an invalid ticket", async () => {
  await expectInvalidTicketRejection();
});

interface AuthenticatedRequest {
  context: APIRequestContext;
  csrfToken: string;
}

async function authenticatedRequest(
  playwright: Playwright,
  email: string,
): Promise<AuthenticatedRequest> {
  const context = await playwright.request.newContext({
    baseURL: apiBaseURL(),
    extraHTTPHeaders: { Origin: "http://127.0.0.1:3000" },
  });
  const login = await context.post("/api/v1/auth/login", {
    data: { email, password: "synodus-demo-password" },
  });
  expect(login.ok(), `${email} can sign in`).toBeTruthy();
  const { csrf_token: csrfToken } = (await login.json()) as { csrf_token: string };
  return { context, csrfToken };
}

async function createTeam(
  request: AuthenticatedRequest,
  leaderEmail: string,
  name: string,
): Promise<string> {
  const response = await request.context.post(`/api/v1/orgs/${organizationID}/teams`, {
    data: { name: `${name} ${Date.now()} ${crypto.randomUUID()}`, leader_email: leaderEmail },
    headers: { "X-CSRF-Token": request.csrfToken },
  });
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { id: string }).id;
}

async function createDocument(request: AuthenticatedRequest, teamID: string): Promise<string> {
  const response = await request.context.post(
    `/api/v1/orgs/${organizationID}/teams/${teamID}/documents`,
    {
      data: { title: "Release access notes" },
      headers: { "X-CSRF-Token": request.csrfToken },
    },
  );
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { id: string }).id;
}

async function expectStatus(
  context: APIRequestContext,
  path: string,
  status: number,
  csrfToken?: string,
) {
  const response = csrfToken
    ? await context.post(path, { headers: { "X-CSRF-Token": csrfToken } })
    : await context.get(path);
  expect(response.status()).toBe(status);
}

async function expectDocumentDenied(
  context: APIRequestContext,
  documentPath: string,
  csrfToken: string,
) {
  await expectStatus(context, documentPath, 404);
  await expectStatus(context, `${documentPath}/socket-ticket`, 404, csrfToken);
}

async function expectInvalidTicketRejection() {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      provider.destroy();
      reject(new Error("Document Room did not reject the invalid ticket"));
    }, 5_000);
    const provider = new HocuspocusProvider({
      name: `release-invalid-ticket-${crypto.randomUUID()}`,
      token: "not-a-document-ticket",
      url: process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:10000/ws/docs",
      onAuthenticationFailed: ({ reason }) => {
        clearTimeout(timeout);
        provider.destroy();
        if (reason === "permission-denied") {
          resolve();
          return;
        }
        reject(new Error(`Unexpected authentication response: ${reason}`));
      },
    });
  });
}

function apiBaseURL() {
  return process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080";
}

function documentURL(orgID: string, teamID: string, documentID: string) {
  return `/api/v1/orgs/${orgID}/teams/${teamID}/documents/${documentID}`;
}
