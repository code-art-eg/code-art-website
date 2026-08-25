import { expect, test } from '@playwright/test'

import { footerFixture, restoreFooter, seedFooter } from '../helpers/seedContent'

test.describe('Footer', () => {
  test.beforeAll(async () => {
    await seedFooter()
  })

  test.afterAll(async () => {
    await restoreFooter()
  })

  test('is visible on the home page with the seeded copyright and social links', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000')

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(footerFixture.copyright)).toBeVisible()

    for (const { url } of footerFixture.socialLinks) {
      const link = footer.locator(`a[href="${url}"]`)
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('target', '_blank')
    }

    await expect(footer.getByRole('link', { name: 'GitHub' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'X' })).toBeVisible()
  })
})
