import { expect, test } from '@playwright/test'

import { cleanupPosts, restoreBio, seedBio, seedPost } from '../helpers/seedContent'

/** Six posts, so the home page must show only the five most recent. */
const posts = Array.from({ length: 6 }, (_, index) => ({
  title: `E2E Home Post ${index + 1}`,
  slug: `test-post-home-${index + 1}`,
  publishedAt: `2026-0${index + 1}-01T00:00:00.000Z`,
}))

test.describe('Latest blog posts on the home page', () => {
  test.beforeAll(async () => {
    await cleanupPosts()
    await seedBio()
    for (const post of posts) {
      await seedPost({
        ...post,
        summary: `Summary for ${post.title}.`,
        content: `Body for ${post.title}.`,
      })
    }
  })

  test.afterAll(async () => {
    await cleanupPosts()
    await restoreBio()
  })

  test('shows the five most recent posts and a link to the archive', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const section = page.locator('section#blog')
    await expect(section.getByRole('heading', { level: 2, name: 'Blog' })).toBeVisible()

    await expect(section.getByRole('listitem')).toHaveCount(5)
    await expect(section.getByRole('link', { name: 'E2E Home Post 6' })).toBeVisible()
    await expect(section.getByText('1 June 2026')).toBeVisible()
    // The oldest of the six is pushed off the home page.
    await expect(section.getByRole('link', { name: 'E2E Home Post 1' })).toHaveCount(0)

    const viewAll = section.getByRole('link', { name: /view all blog posts/i })
    await viewAll.click()
    await expect(page).toHaveURL('http://localhost:3000/blog')
    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible()
  })

  test('the main menu has a Blog entry that scrolls to the section', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const nav = page.getByRole('navigation', { name: 'Main' })
    const blogLink = nav.getByRole('link', { name: 'Blog' })
    await expect(blogLink).toBeVisible()

    await blogLink.click()

    await expect(page.locator('section#blog')).toBeInViewport()
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(0)
    await expect(blogLink).toHaveAttribute('aria-current', 'true')
  })

  test('a post link on the home page opens the post', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await page.locator('section#blog').getByRole('link', { name: 'E2E Home Post 6' }).click()

    await expect(page).toHaveURL('http://localhost:3000/blog/test-post-home-6')
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Home Post 6' })).toBeVisible()
  })
})
