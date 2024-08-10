// tests/bugs.spec.js
import { test, expect } from '@playwright/test';

test('navigate to bug details page', async ({ page }) => {
  await page.goto('http://localhost:4173/bugs');

  // Assuming there's a link to a bug with ID 123
  await page.click('text=View Details', { index: 0 }); // Click the first "View Details" link

  await expect(page).toHaveURL('/bugs/1794235');
  await expect(page.locator('h2')).toContainText('Bug Details');
  await expect(page.locator('p')).toContainText('ID: 123');
});
