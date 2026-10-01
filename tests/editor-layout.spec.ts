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
  await page.getByLabel("Editor text size", { exact: true }).selectOption("20");
  await expect(page.locator(".doc-body")).toHaveCSS("font-size", "20px");
  await page.screenshot({ path: "test-results/document-editor-desktop.png" });
});

test("inline formatting and active toolbar states follow the document selection", async ({ page }) => {
  await createDocument(page);
  const body = page.getByRole("textbox", { name: "Document body", exact: true });
  await body.fill("Research findings");
  await body.press("ControlOrMeta+A");
  for (const [label, tag] of [["Bold", "strong"], ["Italic", "em"], ["Underline", "u"], ["Strikethrough", "s"]]) {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.click();
    await expect(body.locator(tag)).toHaveText("Research findings");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(button).toHaveCSS("background-color", "rgb(11, 15, 20)");
    await button.click();
    await expect(body.locator(tag)).toHaveCount(0);
    await expect(button).toHaveAttribute("aria-pressed", "false");
  }
  await page.getByRole("button", { name: "Inline code", exact: true }).click();
  await expect(body.locator("code")).toHaveText("Research findings");
  await page.getByRole("button", { name: "Clear formatting", exact: true }).click();
  await expect(body.locator("code")).toHaveCount(0);
  await expect(body.locator("p")).toHaveText("Research findings");
});

test("headings, lists, quotes, code blocks, and dividers are available", async ({ page }) => {
  await createDocument(page);
  const body = page.getByRole("textbox", { name: "Document body", exact: true });
  await body.fill("Research findings");
  await body.press("Home");
  await body.press("Shift+End");
  for (const level of [1, 2, 3]) {
    await page.getByLabel("Block format", { exact: true }).selectOption(`heading-${level}`);
    await expect(body.locator(`h${level}`).filter({ hasText: "Research findings" })).toHaveText("Research findings");
  }
  await page.getByLabel("Block format", { exact: true }).selectOption("paragraph");
  await expect(body.locator("p").filter({ hasText: "Research findings" })).toHaveText("Research findings");
  for (const [label, tag] of [["Bullet list", "ul"], ["Numbered list", "ol"], ["Quote", "blockquote"], ["Code block", "pre"]]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(body.locator(tag)).toContainText("Research findings");
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(body.locator(tag)).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Insert divider", exact: true }).click();
  await expect(body.locator("hr")).toHaveCount(1);
});

test("links can be inserted, edited, and removed without navigating away", async ({ page }) => {
  await createDocument(page);
  const body = page.getByRole("textbox", { name: "Document body", exact: true });
  await body.fill("Reference paper");
  await body.press("ControlOrMeta+A");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByLabel("Link URL", { exact: true }).fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(page.getByText("Use an http://, https:// or mailto: link.", { exact: true })).toBeVisible();
  await expect(body.locator("a")).toHaveCount(0);
  await page.getByLabel("Link URL", { exact: true }).fill("https://example.com/paper");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(body.locator("a")).toHaveAttribute("href", "https://example.com/paper");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByLabel("Link URL", { exact: true })).toHaveValue("https://example.com/paper");
  await page.getByLabel("Link URL", { exact: true }).fill("https://example.com/revised");
  await page.getByRole("button", { name: "Apply link", exact: true }).click();
  await expect(body.locator("a")).toHaveAttribute("href", "https://example.com/revised");
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await page.getByRole("button", { name: "Remove link", exact: true }).click();
  await expect(body.locator("a")).toHaveCount(0);
});

test("collaboration-aware undo and redo work from the toolbar", async ({ page }) => {
  await createDocument(page);
  const body = page.getByRole("textbox", { name: "Document body", exact: true });
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
  await body.fill("History check");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(body).not.toContainText("History check");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(body).toContainText("History check");
});

test("the toolbar and full-width editor remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, ACCOUNTS.member);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Neural Imaging" }).click();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Documents", exact: true }).click();
  await page.getByRole("button", { name: "New document" }).click();
  const body = page.getByRole("textbox", { name: "Document body", exact: true });
  await body.fill("Readable mobile notes");
  await page.getByLabel("Editor text size", { exact: true }).selectOption("24");
  await expect(body).toHaveCSS("font-size", "24px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const bounds = await body.boundingBox();
  const toolbar = await page.getByRole("toolbar", { name: "Document formatting" }).boundingBox();
  if (!bounds || !toolbar) throw new Error("Editor is not visible");
  expect(Math.abs(bounds.width - toolbar.width)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/document-editor-mobile.png" });
});
