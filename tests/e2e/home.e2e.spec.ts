import { expect, test } from '@playwright/test'

import { bioFixture, restoreBio, seedBio } from '../helpers/seedContent'

test.describe('Home page bio', () => {
  test.beforeAll(async () => {
    await seedBio()
  })

  test.afterAll(async () => {
    await restoreBio()
  })

  test('renders the bio hero and about me content', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page.getByRole('heading', { level: 1, name: bioFixture.title })).toBeVisible()
    await expect(page.getByText(bioFixture.subtitle)).toBeVisible()
    await expect(page.getByText(bioFixture.shortPhrase)).toBeVisible()

    await expect(page.getByRole('heading', { level: 2, name: 'About me' })).toBeVisible()
    await expect(
      page.getByText('I have been writing software professionally for over a decade.'),
    ).toBeVisible()
    await expect(
      page.getByText('These days I work mostly with TypeScript, React and .NET.'),
    ).toBeVisible()
  })

  test('uses the bio for the page metadata and exposes the #about anchor', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(`${bioFixture.title} — ${bioFixture.subtitle}`)
    await expect(page.locator('section#about')).toBeVisible()
  })
})
