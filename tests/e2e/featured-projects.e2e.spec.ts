import { expect, test, type Page } from '@playwright/test'

import type { Project } from '@/payload-types'
import {
  cleanupProjects,
  restoreBio,
  restoreHomePageProjects,
  restoreProjectPageProjects,
  seedBio,
  seedHomePageProjects,
  seedManyProjects,
  seedProjectPageProjects,
} from '../helpers/seedContent'

/** Card titles currently rendered in the home page projects section, in DOM order. */
const cardTitles = (page: Page) =>
  page.locator('section#projects').getByRole('article').getByRole('heading').allTextContents()

let projects: Project[] = []

test.beforeAll(async () => {
  await cleanupProjects()
  await seedBio()
  projects = await seedManyProjects(6)
})

test.afterAll(async () => {
  await cleanupProjects()
  await restoreBio()
})

test.describe('Featured projects on the home page', () => {
  // Deliberately neither the newest three nor creation order: the section must follow the
  // global's order, not the projects collection's.
  const curated = () => [projects[2], projects[0], projects[4]]

  test.beforeAll(async () => {
    await seedHomePageProjects(curated())
    await seedProjectPageProjects(projects)
  })

  test.afterAll(async () => {
    await restoreHomePageProjects()
    await restoreProjectPageProjects()
  })

  test('shows exactly the curated projects, in the curated order', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const section = page.locator('section#projects')
    await expect(section.getByRole('heading', { level: 2, name: 'Projects' })).toBeVisible()
    await expect(section.getByRole('article')).toHaveCount(3)

    expect(await cardTitles(page)).toEqual(['E2E Project 3', 'E2E Project 1', 'E2E Project 5'])

    // A project the global leaves out never reaches the home page, however new it is.
    await expect(section.getByRole('link', { name: 'E2E Project 6' })).toHaveCount(0)
  })

  test('links to the full list when /projects lists more than the home page shows', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000')

    const section = page.locator('section#projects')
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

    await page.locator('section#projects').getByRole('link', { name: 'E2E Project 5' }).click()

    await expect(page).toHaveURL('http://localhost:3000/projects/test-portfolio-project-5')
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Project 5' })).toBeVisible()
  })
})

test.describe('Featured projects with an empty curation', () => {
  test.beforeAll(async () => {
    await seedHomePageProjects([])
    await seedProjectPageProjects(projects)
  })

  test.afterAll(async () => {
    await restoreHomePageProjects()
    await restoreProjectPageProjects()
  })

  test('hides the section and its "View all projects" link', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // The bio still rendered, so this is an empty curation and not a broken page.
    await expect(page.locator('section#about')).toBeVisible()
    await expect(page.locator('section#projects')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /view all projects/i })).toHaveCount(0)
  })
})

test.describe('Featured projects when the curation covers every listed project', () => {
  test.beforeAll(async () => {
    await seedHomePageProjects(projects)
    await seedProjectPageProjects(projects)
  })

  test.afterAll(async () => {
    await restoreHomePageProjects()
    await restoreProjectPageProjects()
  })

  test('shows all of them with no "View all projects" link', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // No five-project cap any more: the global decides how many are shown.
    await expect(page.locator('section#projects').getByRole('article')).toHaveCount(6)
    await expect(page.getByRole('link', { name: /view all projects/i })).toHaveCount(0)
  })
})
