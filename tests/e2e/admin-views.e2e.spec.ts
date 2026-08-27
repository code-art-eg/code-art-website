import { test, expect, Page, ConsoleMessage } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const serverURL = 'http://localhost:3000'

/**
 * A field whose component fails to resolve does not surface an error in the admin UI — it just
 * renders nothing. These tests walk every collection and global view, assert the expected
 * fields are present, and fail on any uncaught exception, so a broken view cannot pass silently.
 */

const collections = [
  { slug: 'work-experience', title: 'Work Experience', fields: ['jobTitle', 'company'] },
  { slug: 'skills', title: 'Skills', fields: ['title'] },
  { slug: 'projects', title: 'Projects', fields: ['title', 'slug', 'skills'] },
  { slug: 'blog', title: 'Blog', fields: ['title', 'slug', 'publishedAt'] },
  { slug: 'media', title: 'Media', fields: [] },
  { slug: 'users', title: 'Users', fields: ['email'] },
]

const globals = [
  { slug: 'bio', title: 'Bio', fields: ['title', 'subtitle', 'aboutMe'] },
  { slug: 'footer', title: 'Footer', fields: ['copyright', 'socialLinks'] },
  { slug: 'home-page-projects', title: 'Home Page Projects', fields: ['projects'] },
  { slug: 'project-page-projects', title: 'Project Page Projects', fields: ['projects'] },
]

/** Next's dev overlay and HMR chatter are noisy; only genuine failures should fail a test. */
const isRealError = (message: ConsoleMessage): boolean => {
  if (message.type() !== 'error') {
    return false
  }
  const text = message.text()
  return !text.includes('Download the React DevTools') && !text.includes('favicon')
}

test.describe('Admin views', () => {
  let page: Page
  let errors: string[]

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })

    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (isRealError(message)) {
        errors.push(`console: ${message.text()}`)
      }
    })
  })

  test.beforeEach(() => {
    errors = []
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  for (const collection of collections) {
    test(`renders the ${collection.title} list view`, async () => {
      await page.goto(`${serverURL}/admin/collections/${collection.slug}`)

      await expect(page.locator('h1', { hasText: collection.title }).first()).toBeVisible()
      expect(errors).toStrictEqual([])
    })

    test(`renders every field on the ${collection.title} create view`, async () => {
      await page.goto(`${serverURL}/admin/collections/${collection.slug}/create`)

      // The save control only renders once the document form itself has mounted.
      await expect(page.locator('#action-save')).toBeVisible()

      for (const field of collection.fields) {
        await expect(
          page.locator(`[id="field-${field}"], [data-field-path="${field}"]`),
        ).toBeVisible()
      }

      expect(errors).toStrictEqual([])
    })
  }

  for (const global of globals) {
    test(`renders every field on the ${global.title} global`, async () => {
      await page.goto(`${serverURL}/admin/globals/${global.slug}`)

      await expect(page.locator('#action-save')).toBeVisible()

      for (const field of global.fields) {
        await expect(
          page.locator(`[id="field-${field}"], [data-field-path="${field}"]`),
        ).toBeVisible()
      }

      expect(errors).toStrictEqual([])
    })
  }
})
