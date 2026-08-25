import { test, expect, Page } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

const serverURL = 'http://localhost:3000'

/** Titles used below. Everything starting with the prefix is deleted before and after the run. */
const skillPrefix = 'E2E Tag Skill'
const existingSkill = `${skillPrefix} Existing`
const newSkill = `${skillPrefix} Brand New`

const findSkills = async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'skills',
    where: { title: { like: skillPrefix } },
    limit: 100,
  })
  return docs
}

const deleteSkills = async () => {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'skills', where: { title: { like: skillPrefix } } })
}

const seedExistingSkill = async () => {
  const payload = await getPayload({ config })
  await payload.create({ collection: 'skills', data: { title: existingSkill } })
}

/**
 * The Projects skills field is a custom tag input: typing a name either picks the skill that
 * exists or, on Enter, creates it there and then. It replaced the stock relationship field's
 * "+" button and document drawer, so these tests assert the drawer is gone and the inline
 * creation really writes to the skills collection.
 */
test.describe('Admin skills tag input', () => {
  let page: Page

  /** The tag input, its search box, and the chips it currently shows. */
  const field = () => page.locator('#field-skills')
  const searchInput = () => field().locator('input[role="combobox"]')
  const chips = () => field().locator('.multi-value-label__text')

  const typeSkill = async (text: string) => {
    await searchInput().fill(text)
    // The menu only lists options once the request behind it has settled.
    await expect(field().locator('.rs__menu')).toBeVisible()
  }

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()
    await deleteSkills()
    await seedExistingSkill()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await deleteSkills()
    await cleanupTestUser()
  })

  test.beforeEach(async () => {
    await page.goto(`${serverURL}/admin/collections/projects/create`)
    await expect(field()).toBeVisible()
  })

  test('has no add-new button or document drawer', async () => {
    await expect(field().locator('.relationship-add-new')).toHaveCount(0)
    await expect(searchInput()).toBeVisible()
  })

  test('selects an existing skill when part of its name is typed', async () => {
    await typeSkill('E2E Tag Skill Exi')
    await page.keyboard.press('Enter')

    await expect(chips()).toHaveText([existingSkill])

    // Typing a prefix must never turn into a skill of its own.
    const titles = (await findSkills()).map((skill) => skill.title)
    expect(titles).toStrictEqual([existingSkill])
  })

  test('creates a skill that does not exist yet and selects it', async () => {
    await typeSkill(newSkill)

    // With no existing match the only entry is the create option, so Enter takes it.
    await expect(field().locator('.rs__option')).toHaveText([`Create "${newSkill}"`])
    await page.keyboard.press('Enter')

    await expect(chips()).toHaveText([newSkill])

    await expect
      .poll(async () => (await findSkills()).map((skill) => skill.title).sort())
      .toStrictEqual([newSkill, existingSkill].sort())

    // Selecting the same skill again on a fresh form reuses the row rather than duplicating it.
    await page.goto(`${serverURL}/admin/collections/projects/create`)
    await typeSkill(newSkill)
    await page.keyboard.press('Enter')

    await expect(chips()).toHaveText([newSkill])
    expect(await findSkills()).toHaveLength(2)
  })

  test('keeps the skills it created when the project is saved', async () => {
    await page.fill('#field-title', 'E2E Tag Skill Project')
    await page.fill('#field-summary', 'Created by the skills tag input test.')

    const description = page.locator('[data-field-path="description"] [contenteditable="true"]')
    await description.click()
    await page.keyboard.type('A project for the skills tag input test.')

    await typeSkill(existingSkill)
    await page.keyboard.press('Enter')
    await expect(chips()).toHaveText([existingSkill])

    await page.click('#action-save')
    await expect(page.locator('.payload-toast-item')).toContainText('successfully')

    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'projects',
      where: { slug: { equals: 'e2e-tag-skill-project' } },
      depth: 1,
    })

    expect(docs).toHaveLength(1)
    expect(
      docs[0].skills.map((skill) => (typeof skill === 'object' ? skill.title : skill)),
    ).toEqual([existingSkill])

    await payload.delete({
      collection: 'projects',
      where: { slug: { equals: 'e2e-tag-skill-project' } },
    })
  })
})
