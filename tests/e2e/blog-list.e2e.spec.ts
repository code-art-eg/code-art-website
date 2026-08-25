import { expect, test } from '@playwright/test'

import { cleanupPosts, postsByYear, seedPostsByYear } from '../helpers/seedContent'

test.describe('Blog list page', () => {
  test.beforeAll(async () => {
    await cleanupPosts()
    await seedPostsByYear()
  })

  test.afterAll(async () => {
    await cleanupPosts()
  })

  test('lists posts newest first with links to each post', async ({ page }) => {
    await page.goto('http://localhost:3000/blog')

    await expect(page).toHaveTitle(/Blog/)
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()

    for (const post of postsByYear) {
      await expect(page.getByRole('link', { name: post.title })).toHaveAttribute(
        'href',
        `/blog/${post.slug}`,
      )
    }

    const titles = await page.getByRole('heading', { level: 2 }).allTextContents()
    expect(titles).toEqual(postsByYear.map((post) => post.title))
  })

  test('offers a filter link per publication year and filters the list', async ({ page }) => {
    await page.goto('http://localhost:3000/blog')

    const filter = page.getByRole('navigation', { name: /year/i })
    await expect(filter.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'true')

    for (const year of ['2026', '2025', '2024']) {
      await expect(filter.getByRole('link', { name: year })).toBeVisible()
    }

    await filter.getByRole('link', { name: '2026' }).click()
    await expect(page).toHaveURL(/[?&]year=2026/)
    await expect(filter.getByRole('link', { name: '2026' })).toHaveAttribute('aria-current', 'true')

    await expect(page.getByRole('link', { name: 'E2E Post 2026 A' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'E2E Post 2026 B' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'E2E Post 2025 A' })).toHaveCount(0)

    await filter.getByRole('link', { name: 'All' }).click()
    await expect(page).toHaveURL('http://localhost:3000/blog')
    await expect(page.getByRole('link', { name: 'E2E Post 2025 A' })).toBeVisible()
  })

  test('paginates and keeps the year filter across pages', async ({ page }) => {
    await page.goto('http://localhost:3000/blog?limit=1&year=2026')

    const pagination = page.getByRole('navigation', { name: 'Blog pagination' })
    await expect(pagination).toBeVisible()
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'E2E Post 2026 A' })).toBeVisible()

    await pagination.getByRole('link', { name: 'Next' }).click()

    await expect(page).toHaveURL(/year=2026/)
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'E2E Post 2026 B' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'E2E Post 2026 A' })).toHaveCount(0)

    // Still filtered: 2026 has exactly two posts, so page 2 is the last one.
    await expect(pagination.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
