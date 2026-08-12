import { test, expect } from '@playwright/test';

test('user can log in successfully', async ({ page }) => {
  // 1. Navigate to your login page
  await page.goto('http://localhost:3000/login');

  // 2. Fill in the credentials
  // Playwright can find elements by their placeholder text
 
  await page.locator('input[type="email"]').fill('admin@aratuwa.edu');
  await page.locator('input[type="password"]').fill('password123');

  // 3. Click the login button
  // Finds a button that has the exact text "Login"
  await page.getByRole('button', { name: 'Sign in' }).click();

  // 4. Verify the login worked
  // Assert that the browser was redirected to the dashboard URL
  await expect(page).toHaveURL('http://localhost:3000/orgs/1');

  // Assert that a specific element on the dashboard is now visible
  await expect(page.locator('h1')).toContainText('Dashboard');
});


