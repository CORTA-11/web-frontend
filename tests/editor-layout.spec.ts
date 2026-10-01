import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

async function createDocument(page: Page) {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");
  await page.getByRole("button", { name: "New document" }).click();
  await expect(page.getByLabel("Document title")).toBeEditable();
  await expect(page.locator(".doc-body")).toBeEditable();
}

test("editor body fills the available document width and uses readable default text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await createDocument(page);
  const body = await page.locator(".doc-body").boundingBox();
  const toolbar = await page.getByRole("toolbar", { name: "Document formatting" }).boundingBox();
  const availableWidth = await page.getByRole("main").evaluate((element) => {
    const style = getComputedStyle(element);
    return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  });
  if (!body || !toolbar) throw new Error("Document editor is not visible");
  expect(Math.abs(body.width - toolbar.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(body.width - availableWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator(".doc-body")).toHaveCSS("font-size", "16px");
  await page.screenshot({ path: "test-results/document-editor-desktop.png" });
});
