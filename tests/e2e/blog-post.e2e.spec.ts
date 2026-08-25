import { expect, test } from '@playwright/test'

import { cleanupPosts, postFixture, seedPost } from '../helpers/seedContent'

const postUrl = `http://localhost:3000/blog/${postFixture.slug}`

test.describe('Blog post page', () => {
  test.beforeAll(async () => {
    await cleanupPosts()
    await seedPost()
  })

  test.afterAll(async () => {
    await cleanupPosts()
  })

  test('renders the post with its markdown content rendered to HTML', async ({ page }) => {
    await page.goto(postUrl)

    await expect(page).toHaveTitle(new RegExp(postFixture.title))
    await expect(page.getByRole('heading', { level: 1, name: postFixture.title })).toBeVisible()
    await expect(page.getByText(postFixture.summary)).toBeVisible()
    await expect(page.getByText(postFixture.formattedDate)).toBeVisible()

    // Markdown was converted to real elements, not printed as source.
    await expect(page.getByRole('heading', { level: 1, name: 'Getting started' })).toBeVisible()
    await expect(page.locator('article strong', { hasText: 'bold' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'link' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
    await expect(page.locator('article li')).toHaveCount(2)
    await expect(page.getByText('# Getting started')).toHaveCount(0)
  })

  test('links back to the blog list', async ({ page }) => {
    await page.goto(postUrl)

    await expect(page.getByRole('link', { name: /back to blog/i })).toHaveAttribute('href', '/blog')
  })

  test('returns 404 for an unknown slug', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/blog/no-such-post')

    expect(response?.status()).toBe(404)
  })
})
