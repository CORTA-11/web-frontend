import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test.setTimeout(90_000);

test("team admin saves shared settings and the summary dialog only takes dates", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await openTeam(page, "Neural Imaging", "Chat");
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Team settings", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page.getByLabel("Endpoint", { exact: true }).fill("https://provider.example/v1/chat/completions");
  await page.getByLabel("Model", { exact: true }).fill("team-model");
  await page.getByLabel("API token", { exact: true }).fill("test-provider-token");
  const saved = page.waitForResponse((response) => response.url().endsWith("/ai/settings") && response.request().method() === "PUT");
  await page.getByRole("button", { name: "Save settings" }).click();
  expect(await (await saved).json()).toEqual({
    endpoint_url: "https://provider.example/v1/chat/completions", model: "team-model", has_api_token: true,
  });
  await expect(page.getByLabel("API token", { exact: true })).toHaveValue("");
  await page.getByLabel("Model", { exact: true }).fill("updated-model");
  const updated = page.waitForResponse((response) => response.url().endsWith("/ai/settings") && response.request().method() === "PUT");
  await page.getByRole("button", { name: "Save settings" }).click();
  expect((await (await updated).json()).has_api_token).toBe(true);
  await expect(page.getByText("A token is saved.", { exact: false })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Chat", exact: true }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("article").first()).toBeVisible();
  await page.getByRole("button", { name: "Summarise chat" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("input")).toHaveCount(2);
  await dialog.getByLabel("From", { exact: true }).fill("2020-01-01");
  await dialog.getByLabel("To", { exact: true }).fill("2030-01-01");
  const result = page.waitForResponse((response) => response.url().endsWith("/ai/process"));
  const summary = page.waitForRequest((request) => request.url().endsWith("/ai/process"));
  await dialog.getByRole("button", { name: "Summarise", exact: true }).click();
  expect(Object.keys((await summary).postDataJSON()).sort()).toEqual(["from", "to"]);
  const response = await result;
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  await expect(dialog.getByText(body.summary.overview, { exact: true }).first()).toBeVisible();
});

test("a team member cannot open team settings", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Chat");
  await expect(page.getByRole("link", { name: "Team settings", exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/\/chat$/);
  await page.goto(page.url().replace(/\/chat$/, "/settings"));
  await expect(page.getByText("Only the team admin can access these settings.")).toBeVisible();
  await expect(page.getByLabel("API token", { exact: true })).toHaveCount(0);
});
