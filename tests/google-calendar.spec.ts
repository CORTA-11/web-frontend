import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("assigned tasks offer a reviewable Google Calendar event using saved details", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");
  await page.getByText("Re-run segmentation on 12 Aug stack", { exact: true }).click();
  await page.getByLabel("Starts", { exact: true }).fill("2026-08-10");
  await page.getByLabel("Due", { exact: true }).fill("2026-08-12");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.getByText("Re-run segmentation on 12 Aug stack", { exact: true }).click();
  await page.getByRole("button", { name: "Add to Google Calendar:" }).click();
  await expect(page.getByText(/Changes to the task will not sync/)).toBeVisible();
  const link = page.getByRole("link", { name: "Open Google Calendar", exact: true });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.origin).toBe("https://calendar.google.com");
  expect(url.searchParams.get("text")).toBe("Re-run segmentation on 12 Aug stack");
  expect(url.searchParams.get("dates")).toBe("20260810/20260813");
  expect(url.searchParams.get("details")).toContain(new URL(page.url()).origin);

  await page.getByRole("dialog", { name: "Add to Google Calendar", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Add to Google Calendar", exact: true })).toBeHidden();
  await page.getByRole("dialog", { name: "Edit task", exact: true }).getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Back to organisation", exact: true }).click();
  const assigned = page.getByRole("heading", { name: "Assigned to you", exact: true }).locator("..");
  await assigned.getByRole("button", { name: "Add to Google Calendar: Re-run segmentation on 12 Aug stack", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open Google Calendar", exact: true })).toHaveAttribute("href", url.href);
});

test("undated assigned tasks explain why calendar export is disabled", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");
  await page.getByText("Re-run segmentation on 12 Aug stack", { exact: true }).click();
  await page.getByLabel("Starts", { exact: true }).fill("");
  await page.getByLabel("Due", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save task", exact: true }).click();
  await page.getByText("Re-run segmentation on 12 Aug stack", { exact: true }).click();
  const button = page.getByRole("button", { name: "Add to Google Calendar:" });
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("title", /Set a start or due date/);
});

test("other people's tasks do not offer personal calendar export", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");
  await page.getByText("Calibrate LSM900 after objective swap", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Add to Google Calendar:" })).toHaveCount(0);
});
