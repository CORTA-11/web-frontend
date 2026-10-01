import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

async function decideAsCreator(page: Page, resourceId: string, decision: "approve" | "deny", creator = 2) {
  return page.evaluate(async ({ resourceId, decision, creator }) => {
    const match = location.pathname.match(/\/orgs\/([^/]+)\/teams\/([^/]+)/);
    if (!match) throw new Error("Not in a team");
    const base = `/api/v1/orgs/${match[1]}/teams/${match[2]}/content-access`;
    const snapshot = await fetch(base, { credentials: "include" }).then((response) => response.json()) as {
      requests: { public_id: string; resource_id: string }[];
    };
    const request = snapshot.requests.find((entry) => entry.resource_id === resourceId);
    if (!request) throw new Error("Request missing");
    const response = await fetch(`${base}/requests/${request.public_id}/${decision}`, {
      method: "POST", credentials: "include", headers: { Authorization: `Bearer mock.${creator}.test` },
    });
    return response.status;
  }, { resourceId, decision, creator });
}

test("restricted document can be requested, denied, retried and opened after creator approval via SSE", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");
  const row = page.getByRole("row").filter({ hasText: "Weekly sync — imaging" });
  await expect(row.getByRole("link")).toHaveCount(0);
  await row.getByRole("button", { name: "Request access", exact: true }).click();
  await expect(row).toContainText("Requested");
  expect(await decideAsCreator(page, "d-1", "deny")).toBe(204);
  await expect(row.getByRole("button", { name: "Request again" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Document and file permissions, 1 unread/ })).toBeVisible();
  await row.getByRole("button", { name: "Request again" }).click();
  await expect(row).toContainText("Requested");
  expect(await decideAsCreator(page, "d-1", "approve")).toBe(204);
  await expect(row.getByRole("link", { name: "Weekly sync — imaging" })).toBeVisible();
  await row.getByRole("link").click();
  await expect(page.locator(".doc-body")).toBeEditable();
});

test("a regular member can directly grant access to a document they created", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");
  const row = page.getByRole("row").filter({ hasText: "Imaging pipeline v2 — spec" });
  await row.getByRole("button", { name: "Manage access" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox").selectOption("2");
  await dialog.getByRole("button", { name: "Grant access", exact: true }).click();
  await expect(dialog.getByText("● granted", { exact: true })).toBeVisible();
});

test("a file's uploader approves access; membership alone cannot download", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");
  const row = page.getByRole("row").filter({ hasText: "lsm900-calibration-2026-08.pdf" });
  const download = row.getByRole("button", { name: /^Download/ });
  await expect(download).toBeDisabled();
  await row.getByRole("button", { name: "Request access", exact: true }).click();
  await expect(row).toContainText("Requested");
  // The uploader is a regular member, not the team leader.
  expect(await decideAsCreator(page, "f-1", "approve", 6)).toBe(204);
  await expect(download).toBeEnabled();
});
