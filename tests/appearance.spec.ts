import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test("accent selector updates the interface and remembers the choice", async ({ page, context }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  const stat = page.locator(".stat-cell--highlight");
  await expect(stat).toHaveCSS("background-color", "rgb(15, 102, 104)");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Teal", exact: true })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitemradio", { name: "Blue", exact: true }).click();
  await expect(stat).toHaveCSS("background-color", "rgb(22, 55, 214)");
  await page.reload();
  await expect(stat).toHaveCSS("background-color", "rgb(22, 55, 214)");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Blue", exact: true })).toHaveAttribute("aria-checked", "true");

  const otherTab = await context.newPage();
  await otherTab.goto("/login");
  await expect(otherTab.locator("html")).toHaveAttribute("data-accent", "blue");
  await page.getByRole("menuitemradio", { name: "Teal", exact: true }).click();
  await expect(stat).toHaveCSS("background-color", "rgb(15, 102, 104)");
  await expect(otherTab.locator("html")).toHaveAttribute("data-accent", "teal");
  await otherTab.close();
});

test("accent selection works when browser storage is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    // Block this preference without breaking MSW's independent cookie store.
    Storage.prototype.getItem = function (key) {
      if (key === "synodus-accent") throw new Error("Storage blocked");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "synodus-accent") throw new Error("Storage blocked");
      return setItem.call(this, key, value);
    };
  });
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitemradio", { name: "Blue", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "blue");
});

test("all additional accents can be selected on mobile and survive reloads", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  const options = [
    { label: "Violet", value: "violet", color: "rgb(100, 65, 165)" },
    { label: "Burgundy", value: "burgundy", color: "rgb(140, 41, 70)" },
    { label: "Amber", value: "amber", color: "rgb(133, 85, 0)" },
    { label: "Forest", value: "forest", color: "rgb(40, 96, 68)" },
    { label: "Graphite", value: "graphite", color: "rgb(74, 83, 96)" },
  ];
  for (const option of options) {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitemradio", { name: option.label, exact: true }).click();
    await expect(page.locator(".stat-cell--highlight")).toHaveCSS("background-color", option.color);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-accent", option.value);
    await expect(page.locator(".stat-cell--highlight")).toHaveCSS("background-color", option.color);
  }
});
