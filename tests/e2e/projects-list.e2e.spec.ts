import { expect, test } from '@playwright/test'

import { cleanupProjects, seedManyProjects } from '../helpers/seedContent'

const PROJECT_COUNT = 5
const PER_PAGE = 2

test.describe('Projects list page', () => {
  test.beforeAll(async () => {
    await cleanupProjects()
    await seedManyProjects(PROJECT_COUNT)
  })

  test.afterAll(async () => {
    await cleanupProjects()
  })

  test('lists projects in a grid with links to their detail pages', async ({ page }) => {
    await page.goto('http://localhost:3000/projects')

    await expect(page).toHaveTitle(/Projects/)
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible()

    const cards = page.getByRole('article')
    await expect(cards.first()).toBeVisible()

    const firstLink = page.getByRole('link', { name: 'E2E Project 5' })
    await expect(firstLink).toHaveAttribute('href', '/projects/test-portfolio-project-5')

    await firstLink.click()
    await expect(page).toHaveURL('http://localhost:3000/projects/test-portfolio-project-5')
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Project 5' })).toBeVisible()
  })

  test('paginates with Previous / Next and numbered pages', async ({ page }) => {
    await page.goto(`http://localhost:3000/projects?limit=${PER_PAGE}`)

    const pagination = page.getByRole('navigation', { name: 'Projects pagination' })
    await expect(pagination).toBeVisible()
    await expect(page.getByRole('article')).toHaveCount(PER_PAGE)

    // 5 projects at 2 per page = 3 pages.
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
})
