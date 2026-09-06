import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

const TEAM = "b21c7f04-3e58-4a19-8d6c-2f9a01e4c773";
const ORG = "8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40";

test("an org admin administers teams without reading their workspace", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Teams", exact: true }).click();

  const row = page.getByRole("row").filter({ hasText: "Neural Imaging" });
  await expect(row).toContainText("Not a member");
  await expect(row.getByRole("link")).toHaveCount(0);

  await expect(page.getByRole("navigation").getByRole("link", { name: /Neural Imaging/ })).toHaveCount(0);
});

for (const section of ["board", "chat", "docs", "files"]) {
  test(`an org admin is refused a team's ${section}`, async ({ page }) => {
    await signIn(page, ACCOUNTS.admin);
    await page.goto(`/orgs/${ORG}/teams/${TEAM}/${section}`);
    await expect(page.getByText("workspace is private")).toBeVisible();
  });
}

test("the server refuses team content to a non-member, not just the UI", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  const status = await page.evaluate(async (team) => {
    const session = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@aratuwa.edu", password: "synodus-demo-password" }),
    });
    const { access_token } = await session.json();
    const response = await fetch(`/api/teams/${team}/chat/messages`, {
      headers: { Authorization: `Bearer ${access_token}` },
      credentials: "include",
    });
    return response.status;
  }, TEAM);
  expect(status).toBe(403);
});
