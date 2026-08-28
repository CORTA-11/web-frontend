import { expect, test } from "@playwright/test";
import { json, org, problem, sessionRoute, team } from "./fixtures";

test.beforeEach(async ({ page }) => { await sessionRoute(page); });

test("team pagination and creation use the live contract", async ({ page }) => {
  let csrf: string | undefined;
  let body: unknown;
  await page.route(`**/api/v1/orgs/${org.id}`, (route) => json(route, org));
  await page.route(`**/api/v1/orgs/${org.id}/teams?**`, (route) => {
    const second = route.request().url().includes("cursor=next-teams");
    return json(route, { items: second ? [{ ...team, name: "Second Team" }] : [team], next_cursor: second ? null : "next-teams", previous_cursor: second ? "prev-teams" : null });
  });
  await page.route(`**/api/v1/orgs/${org.id}/teams`, async (route) => {
    csrf = route.request().headers()["x-csrf-token"];
    body = route.request().postDataJSON();
    await json(route, team, 201);
  });
  await page.goto(`/orgs/${org.id}`);
  await expect(page.getByText(team.name)).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Second Team")).toBeVisible();
  await page.getByLabel("Team name").fill("New Team");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  expect(body).toEqual({ name: "New Team" });
  expect(csrf).toBe("csrf-test-token");
});

test("workspace surfaces authorization and not-found details", async ({ page }) => {
  await page.route(`**/api/v1/orgs/${org.id}`, (route) => json(route, org));
  await page.route(`**/api/v1/orgs/${org.id}/teams?**`, (route) => json(route, problem(403, "Team listing is not permitted."), 403));
  await page.goto(`/orgs/${org.id}`);
  await expect(page.getByText("This workspace is unavailable. Team listing is not permitted.", { exact: true })).toBeVisible();
});
