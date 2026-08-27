import { expect, test } from '@playwright/test'

import type { Project } from '@/payload-types'
import {
  cleanupProjects,
  restoreProjectPageProjects,
  seedManyProjects,
  seedProjectPageProjects,
} from '../helpers/seedContent'

const PROJECT_COUNT = 5
const PER_PAGE = 2

let projects: Project[] = []

test.describe('Projects list page', () => {
  test.beforeAll(async () => {
    await cleanupProjects()
    projects = await seedManyProjects(PROJECT_COUNT)
    // The page lists exactly what the global curates, which is what makes the counts and
    // page numbers below independent of whatever else the developer's database holds.
    await seedProjectPageProjects(projects)
  })

  test.afterAll(async () => {
    await restoreProjectPageProjects()
    await cleanupProjects()
  })

  test('lists projects in a grid with links to their detail pages', async ({ page }) => {
    await page.goto('http://localhost:3000/projects')

    await expect(page).toHaveTitle(/Projects/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    await expect(page.getByText(`${PROJECT_COUNT} projects`)).toBeVisible()

    const cards = page.getByRole('article')
    await expect(cards).toHaveCount(PROJECT_COUNT)

    const firstLink = page.getByRole('link', { name: 'E2E Project 5' })
    await expect(firstLink).toHaveAttribute('href', '/projects/test-portfolio-project-5')

    await firstLink.click()
    await expect(page).toHaveURL('http://localhost:3000/projects/test-portfolio-project-5')
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Project 5' })).toBeVisible()
  })

  test('lists the curated projects in the curated order', async ({ page }) => {
    await seedProjectPageProjects([projects[3], projects[0], projects[4]])

    await page.goto('http://localhost:3000/projects')

    await expect(page.getByRole('article')).toHaveCount(3)
    expect(await page.getByRole('article').getByRole('heading').allTextContents()).toEqual([
      'E2E Project 4',
      'E2E Project 1',
      'E2E Project 5',
    ])

    await seedProjectPageProjects(projects)
  })

  test('paginates with Previous / Next and numbered pages', async ({ page }) => {
    await page.goto(`http://localhost:3000/projects?limit=${PER_PAGE}`)

    const pagination = page.getByRole('navigation', { name: 'Projects pagination' })
    await expect(pagination).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(PER_PAGE)

    // 5 curated projects at 2 per page = 3 pages.
    await expect(pagination.getByRole('link', { name: 'Page 3' })).toBeVisible()
    await expect(pagination.getByRole('link', { name: 'Previous' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await pagination.getByRole('link', { name: 'Next' }).click()
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(pagination.getByRole('link', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await pagination.getByRole('link', { name: 'Page 3' }).click()
    await expect(page).toHaveURL(/[?&]page=3/)
    await expect(page.getByRole('article')).toHaveCount(1)
    await expect(pagination.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    await pagination.getByRole('link', { name: 'Previous' }).click()
    await expect(page).toHaveURL(/[?&]page=2/)
  })

  test('lists nothing when the curation is empty', async ({ page }) => {
    await seedProjectPageProjects([])

    await page.goto('http://localhost:3000/projects')

    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()
    await expect(page.getByText('0 projects')).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(0)
    await expect(page.getByText('No projects have been published yet.')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Projects pagination' })).toHaveCount(0)

    await seedProjectPageProjects(projects)
  })
})
