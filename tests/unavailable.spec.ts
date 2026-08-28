import { expect, test } from "@playwright/test";
import { auth, json, org, team } from "./fixtures";

test("unsupported routes never request mock feature data", async ({ page }) => {
  const featureRequests: string[] = [];
  await page.route("**/api/v1/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/v1/auth/session") {
      await json(route, auth);
      return;
    }
    featureRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto(`/orgs/${org.id}/teams/${team.id}/chat`);
  await expect(page.getByRole("heading", { name: "Chat unavailable" })).toBeVisible();
  expect(featureRequests).toEqual([]);
});
