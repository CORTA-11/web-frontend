import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";
import { accents } from "../src/features/appearance/accents";

test("organisation switcher keeps hovered and keyboard-focused items readable", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("button", { name: /Aratuwa Research Lab/ }).click();
  const item = page.getByRole("menuitem", { name: "Ruhuna Marine Station" });
  await item.hover();
  const colors = await item.evaluate((element) => {
    const style = getComputedStyle(element);
    const label = element.querySelector("span");
    return {
      background: style.backgroundColor,
      text: label ? getComputedStyle(label).color : style.color,
    };
  });
  expect(colors).toEqual({ background: "rgb(15, 102, 104)", text: "rgb(255, 255, 255)" });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await expect(item).toBeFocused();
  await expect(item).toHaveCSS("background-color", "rgb(15, 102, 104)");
  await expect(item.locator("span").first()).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(item.locator("svg")).toHaveCSS("color", "rgb(255, 255, 255)");
});

test("menu hover contrast follows every accent", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  for (const accent of accents) {
    await page.getByRole("button", { name: "Account menu" }).click();
    const radio = page.getByRole("menuitemradio", { name: accent.label, exact: true });
    await radio.hover();
    await expect(radio).toHaveCSS("color", "rgb(255, 255, 255)");
    await radio.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-accent", accent.value);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    const background = await page.locator(".stat-cell--highlight").evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.getByRole("button", { name: /Aratuwa Research Lab/ }).click();
    const item = page.getByRole("menuitem", { name: "Ruhuna Marine Station" });
    await item.hover();
    await expect(item).toHaveCSS("background-color", background);
    await expect(item.locator("span").first()).toHaveCSS("color", "rgb(255, 255, 255)");
    await page.keyboard.press("Escape");
  }
});
