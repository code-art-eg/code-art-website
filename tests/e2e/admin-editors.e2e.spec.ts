import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const serverURL = 'http://localhost:3000'

/**
 * Rich text fields render through client components that the admin panel resolves via the
 * generated import map. When that map is stale the field renders as nothing at all, with no
 * error in the UI — so these tests open every editor in the CMS and assert it is really there
 * and really typeable.
 */

/** Every rich text field in the content model, with the view that edits it. */
const richTextFields = [
  { name: 'Bio: About me', url: '/admin/globals/bio', path: 'aboutMe' },
  {
    name: 'Work Experience: Job description',
    url: '/admin/collections/work-experience/create',
    path: 'jobDescription',
  },
  {
    name: 'Projects: Description',
    url: '/admin/collections/projects/create',
    path: 'description',
  },
]

test.describe('Admin editors', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  for (const field of richTextFields) {
    test(`renders an editable rich text editor for ${field.name}`, async () => {
      await page.goto(`${serverURL}${field.url}`)

      const fieldWrapper = page.locator(`[data-field-path="${field.path}"]`)
      await expect(fieldWrapper).toBeVisible()

      // The contenteditable surface only exists once the lexical client bundle has loaded.
      const editor = fieldWrapper.locator('[contenteditable="true"]')
      await expect(editor).toBeVisible()

      await editor.click()
      await page.keyboard.type('Hello from the editor')
      await expect(editor).toContainText('Hello from the editor')

      // The toolbar features are separate client components from the editor itself, so a
      // partially stale import map yields a typeable box with no formatting controls. The
      // default editor uses the inline toolbar, which only appears once text is selected.
      await page.keyboard.press('ControlOrMeta+A')
      const toolbar = page.locator('.inline-toolbar-popup')
      await expect(toolbar).toBeVisible()
      await expect(toolbar.locator('.toolbar-popup__button').first()).toBeVisible()
    })
  }

  test('renders the markdown code editor for Blog: Content', async () => {
    await page.goto(`${serverURL}/admin/collections/blog/create`)

    const codeField = page.locator('#field-content')
    await expect(codeField).toBeVisible()

    // Monaco replaces the textarea it mounts on, so wait for its own rendered surface.
    await expect(codeField.locator('.monaco-editor').first()).toBeVisible()
  })
})
