import { expect, test } from '@playwright/test'

import {
  cleanupWorkExperience,
  restoreBio,
  seedBio,
  seedWorkExperience,
  workExperienceFixture,
} from '../helpers/seedContent'

test.describe('Work experience and main menu', () => {
  test.beforeAll(async () => {
    await seedBio()
    await seedWorkExperience()
  })

  test.afterAll(async () => {
    await cleanupWorkExperience()
    await restoreBio()
  })

  test('renders the experience timeline on the home page, newest first', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const section = page.locator('section#experience')
    await expect(section.getByRole('heading', { level: 2, name: 'Experience' })).toBeVisible()

    const [current, previous] = workExperienceFixture

    await expect(section.getByRole('heading', { level: 3, name: current.jobTitle })).toBeVisible()
    await expect(section.getByRole('link', { name: current.company })).toHaveAttribute(
      'href',
      current.companyUrl!,
    )
    await expect(section.getByText(`${current.startYear} — Present`)).toBeVisible()
    await expect(section.getByText('Leading the platform team and its architecture.')).toBeVisible()

    await expect(section.getByRole('heading', { level: 3, name: previous.jobTitle })).toBeVisible()
    await expect(section.getByText(`${previous.startYear} — ${previous.endYear}`)).toBeVisible()

    // Newest first.
    const titles = await section.getByRole('heading', { level: 3 }).allTextContents()
    expect(titles).toEqual([current.jobTitle, previous.jobTitle])
  })

  test('the fixed menu stays visible and scrolls to each section', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const nav = page.getByRole('navigation', { name: 'Main' })
    await expect(nav).toBeVisible()
    await expect(page.locator('header')).toHaveCSS('position', 'fixed')

    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    await nav.getByRole('link', { name: 'Experience' }).click()
    await expect(page.locator('section#experience')).toBeInViewport()
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(0)
    await expect(nav.getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    // The menu is fixed, so it is still on screen after scrolling.
    await expect(nav).toBeVisible()

    await nav.getByRole('link', { name: 'About' }).click()
    await expect(page.locator('section#about')).toBeInViewport()
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0)
  })
})
