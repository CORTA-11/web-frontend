import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

for (const viewport of [
  { name: "desktop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 650 },
]) {
  test(`${viewport.name}: a single organisation still has a creation dropdown`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signIn(page, ACCOUNTS.leader);
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
    await expect(page).toHaveURL(/\/orgs\/[^/]+$/);
    const url = page.url();
    const switcher = page.getByRole("button", { name: "Select organisation: Aratuwa Research Lab", exact: true });
    await switcher.click();
    await expect(page.getByRole("menuitem", { name: "Aratuwa Research Lab", exact: true })).toBeDisabled();
    await expect(page.getByRole("menuitem", { name: "View all organisations", exact: true })).toBeVisible();
    await page.getByRole("menuitem", { name: "Create organisation", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Create an organisation", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Organisation name", { exact: true })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(url);
    await switcher.click();
    await page.getByRole("menuitem", { name: "Create organisation", exact: true }).click();
    await dialog.getByLabel("Organisation name", { exact: true }).fill(`Tour ${viewport.name} organisation`);
    const request = page.waitForRequest((req) => req.method() === "POST" && req.url().endsWith("/v1/orgs"));
    await dialog.getByRole("button", { name: "Create organisation", exact: true }).click();
    expect((await request).postDataJSON()).toEqual({ name: `Tour ${viewport.name} organisation` });
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(`Tour ${viewport.name} organisation created`, { exact: true })).toBeVisible();
  });
}

test("the organisation dropdown retains switching for multiple organisations", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("button", { name: /^Select organisation:/ }).click();
  await expect(page.getByRole("menuitem", { name: "Create organisation", exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "Ruhuna Marine Station", exact: true }).click();
  await expect(page.getByRole("group", { name: "Current organisation", exact: true })).toContainText("Ruhuna Marine Station");
});
