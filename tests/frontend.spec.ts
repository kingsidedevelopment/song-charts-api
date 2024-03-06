import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
	await page.goto('http://127.0.0.1:3412')

	// Expect a title "to contain" a substring.
	await expect(page).toHaveTitle(/song-charts/)
})

test('start with loading view', async ({ page }) => {
	await page.goto('http://127.0.0.1:3412')

	// Expect the loading view to be visible.
	await expect(page.locator('#loading-results')).toBeVisible()
})

test('start with hidden results', async ({ page }) => {
	await page.goto('http://127.0.0.1:3412')

	// Expect the results view to be hidden.
	await expect(page.locator('#results-wrapper')).toBeHidden()
	await expect(page.locator('#results-heading')).toBeHidden()
	await expect(page.locator('#results-container')).toBeHidden()
})
