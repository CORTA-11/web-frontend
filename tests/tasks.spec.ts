import { expect, test } from "@playwright/test";
import { json, org, problem, sessionRoute, team } from "./fixtures";

const original = {
  id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  description: "Reproduce benchmark results",
  status: "todo",
  created_at: "2026-08-27T09:00:00Z",
  updated_at: "2026-08-27T09:00:00Z",
};

test.beforeEach(async ({ page }) => { await sessionRoute(page); });

test("task create, full updates, and deletion send CSRF", async ({ page }) => {
  let tasks = [original];
  const writes: { method: string; csrf?: string; body?: unknown }[] = [];
  const collection = new RegExp(`/api/v1/orgs/${org.id}/teams/${team.id}/tasks(?:\\?.*)?$`);
  await page.route(collection, async (route) => {
    const request = route.request();
    if (request.method() === "GET") return json(route, { items: tasks, next_cursor: null, previous_cursor: null });
    writes.push({ method: "POST", csrf: request.headers()["x-csrf-token"], body: request.postDataJSON() });
    const created = { ...original, id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", description: request.postDataJSON().description };
    tasks = [...tasks, created];
    await json(route, created, 201);
  });
  await page.route(`**/api/v1/orgs/${org.id}/teams/${team.id}/tasks/*`, async (route) => {
    const request = route.request();
    writes.push({ method: request.method(), csrf: request.headers()["x-csrf-token"], body: request.postDataJSON() });
    const id = request.url().split("/").at(-1)!;
    if (request.method() === "DELETE") {
      tasks = tasks.filter((task) => task.id !== id);
      return route.fulfill({ status: 204 });
    }
    const body = request.postDataJSON();
    tasks = tasks.map((task) => task.id === id ? { ...task, ...body } : task);
    await json(route, tasks.find((task) => task.id === id));
  });
  await page.goto(`/orgs/${org.id}/teams/${team.id}/board`);
  await page.getByLabel("New task description").fill("Publish findings");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("Publish findings")).toBeVisible();
  await page.getByLabel("Task status").first().selectOption("in_progress");
  expect(writes.at(-1)?.body).toEqual({ description: original.description, status: "in_progress" });
  await page.getByText(original.description, { exact: true }).click();
  await page.getByLabel("Task description", { exact: true }).fill("Reproduce all benchmarks");
  await page.getByRole("button", { name: "Save" }).click();
  expect(writes.at(-1)?.body).toEqual({ description: "Reproduce all benchmarks", status: "in_progress" });
  await page.getByRole("button", { name: "Delete Reproduce all benchmarks" }).click();
  await expect(page.getByText("Reproduce all benchmarks", { exact: true })).toHaveCount(0);
  expect(writes.map((write) => write.csrf)).toEqual(writes.map(() => "csrf-test-token"));
});

test("task authorization failures render", async ({ page }) => {
  await page.route(new RegExp(`/api/v1/orgs/${org.id}/teams/${team.id}/tasks(?:\\?.*)?$`), (route) =>
    json(route, problem(403, "Task access is not permitted."), 403));
  await page.goto(`/orgs/${org.id}/teams/${team.id}/board`);
  await expect(page.getByText("Task access is not permitted.", { exact: true })).toBeVisible();
});
