import { expect, test } from "@playwright/test";
import { json, org, problem, sessionRoute } from "./fixtures";

test.beforeEach(async ({ page }) => { await sessionRoute(page); });

test("organization pagination and lifecycle states render", async ({ page }) => {
  const provisioning = { ...org, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "New Lab", lifecycle_state: "provisioning" };
  const seen: string[] = [];
  await page.route("**/api/v1/orgs?**", async (route) => {
    seen.push(route.request().url());
    const next = route.request().url().includes("cursor=next-page");
    await json(route, next
      ? { items: [provisioning], next_cursor: null, previous_cursor: "previous-page" }
      : { items: [org], next_cursor: "next-page", previous_cursor: null });
  });
  await page.goto("/orgs");
  await expect(page.getByText("Applied Systems Lab")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("New Lab")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  expect(seen.at(-1)).toContain("cursor=next-page");
});

test("organization creation sends CSRF and safe problem details render", async ({ page }) => {
  let csrf: string | undefined;
  await page.route("**/api/v1/orgs?**", (route) => json(route, { items: [], next_cursor: null, previous_cursor: null }));
  await page.route("**/api/v1/orgs", async (route) => {
    csrf = route.request().headers()["x-csrf-token"];
    await json(route, problem(403, "Organization creation is restricted."), 403);
  });
  await page.goto("/orgs");
  await page.getByLabel("Organization name").fill("Denied Lab");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Organization creation is restricted.", { exact: true })).toBeVisible();
  expect(csrf).toBe("csrf-test-token");
});
