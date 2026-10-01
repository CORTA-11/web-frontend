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

for (const catalog of [
  { section: "Documents", owned: "Imaging pipeline v2 — spec", restricted: "Weekly sync — imaging" },
  { section: "Files", owned: "segmentation-params.json", restricted: "lsm900-calibration-2026-08.pdf" },
]) {
  test(`${catalog.section} separate status from vertically aligned access buttons`, async ({ page }) => {
    await signIn(page, ACCOUNTS.member);
    await openTeam(page, "Neural Imaging", catalog.section);
    await expect(page.getByRole("columnheader", { name: "Status", exact: true })).toBeVisible();
    const headers = await page.getByRole("columnheader").allTextContents();
    const statusColumn = headers.indexOf("Status");
    const accessColumn = headers.indexOf("Access");
    expect(statusColumn).toBeGreaterThanOrEqual(0);
    expect(accessColumn).toBe(statusColumn + 1);
    const owned = page.getByRole("row").filter({ hasText: catalog.owned });
    const restricted = page.getByRole("row").filter({ hasText: catalog.restricted });
    await expect(owned.getByRole("cell").nth(statusColumn)).toHaveText("Creator");
    await expect(restricted.getByRole("cell").nth(statusColumn)).toHaveText("Restricted");
    await expect(owned.getByRole("cell").nth(accessColumn)).toHaveText("Manage access");
    await expect(restricted.getByRole("cell").nth(accessColumn)).toHaveText("Request access");
    const manage = await owned.getByRole("button", { name: "Manage access" }).boundingBox();
    const request = await restricted.getByRole("button", { name: "Request access" }).boundingBox();
    expect(manage).not.toBeNull();
    expect(request).not.toBeNull();
    expect(Math.abs(manage!.x - request!.x)).toBeLessThan(1);
    expect(Math.abs(manage!.width - request!.width)).toBeLessThan(1);
  });
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
  const notification = page.getByRole("button", { name: /Document and file permissions, 1 unread/ });
  await expect(notification).toBeVisible();
  await notification.click();
  await expect(page.getByRole("menuitem").filter({ hasText: "was denied" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Document and file permissions/ })).toHaveCount(0);
  // Leaving and re-entering the team remounts the notification consumer.
  await page.getByRole("navigation").getByRole("link", { name: "Back to organisation", exact: true }).click();
  await openTeam(page, "Neural Imaging", "Documents");
  await expect(row.getByRole("button", { name: "Request again" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Document and file permissions/ })).toHaveCount(0);
  await row.getByRole("button", { name: "Request again" }).click();
  await expect(row).toContainText("Requested");
  expect(await decideAsCreator(page, "d-1", "approve")).toBe(204);
  await expect(row.getByRole("link", { name: "Weekly sync — imaging" })).toBeVisible();
  await expect(notification).toBeVisible();
  await notification.click();
  await expect(page.getByRole("menuitem").filter({ hasText: "was approved" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Document and file permissions/ })).toHaveCount(0);
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
