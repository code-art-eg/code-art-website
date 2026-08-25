import { expect, test } from '@playwright/test'

import { cleanupProjects, restoreBio, seedBio, seedManyProjects } from '../helpers/seedContent'

test.describe('Featured projects on the home page', () => {
  test.beforeAll(async () => {
    await cleanupProjects()
    await seedBio()
    // 6 highlighted projects: only 5 are featured, so "View all projects" must appear.
    await seedManyProjects(6, { highlight: true })
  })

  test.afterAll(async () => {
    await cleanupProjects()
    await restoreBio()
  })

  test('shows at most five highlighted projects and a link to the full list', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const section = page.locator('section#projects')
    await expect(section.getByRole('heading', { level: 2, name: 'Projects' })).toBeVisible()
    await expect(section.getByRole('article')).toHaveCount(5)

    await expect(section.getByRole('link', { name: 'E2E Project 6' })).toHaveAttribute(
      'href',
      '/projects/test-portfolio-project-6',
    )

    const viewAll = section.getByRole('link', { name: /view all projects/i })
    await expect(viewAll).toBeVisible()

    await viewAll.click()
    await expect(page).toHaveURL('http://localhost:3000/projects')
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
  })

  test('the main menu has a Projects entry that scrolls to the section', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const nav = page.getByRole('navigation', { name: 'Main' })
    const projectsLink = nav.getByRole('link', { name: 'Projects' })
    await expect(projectsLink).toBeVisible()

    await projectsLink.click()

    await expect(page.locator('section#projects')).toBeInViewport()
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(0)
    await expect(projectsLink).toHaveAttribute('aria-current', 'true')
  })

  test('a featured card links through to the project detail page', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.locator('section#projects').getByRole('link', { name: 'E2E Project 6' }).click()

    await expect(page).toHaveURL('http://localhost:3000/projects/test-portfolio-project-6')
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Project 6' })).toBeVisible()
  })
})
