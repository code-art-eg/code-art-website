import { expect, test } from '@playwright/test'

import { cleanupProjects, projectFixture, seedProject } from '../helpers/seedContent'

const projectUrl = `http://localhost:3000/projects/${projectFixture.slug}`

test.describe('Project detail page', () => {
  test.beforeAll(async () => {
    await cleanupProjects()
    await seedProject()
  })

  test.afterAll(async () => {
    await cleanupProjects()
  })

  test('renders the project content, links and skills', async ({ page }) => {
    await page.goto(projectUrl)

    await expect(page).toHaveTitle(new RegExp(projectFixture.title))
    await expect(page.getByRole('heading', { level: 1, name: projectFixture.title })).toBeVisible()
    await expect(page.getByText(projectFixture.summary)).toBeVisible()
    await expect(page.getByText(projectFixture.description)).toBeVisible()

    await expect(page.getByRole('link', { name: /visit project/i })).toHaveAttribute(
      'href',
      projectFixture.externalLink,
    )
    await expect(page.getByRole('link', { name: /view source/i })).toHaveAttribute(
      'href',
      projectFixture.githubLink,
    )

    const skills = page.getByRole('list', { name: 'Skills' })
    for (const skill of projectFixture.skills) {
      await expect(skills.getByText(skill)).toBeVisible()
    }

    await expect(page.getByRole('link', { name: /back to projects/i })).toHaveAttribute(
      'href',
      '/projects',
    )
  })

  test('steps through the image carousel', async ({ page }) => {
    await page.goto(projectUrl)

    await expect(page.getByAltText('First screenshot')).toBeVisible()
    await expect(page.getByText('Image 1 of 3')).toBeAttached()

    await page.getByRole('button', { name: 'Next image' }).click()
    await expect(page.getByAltText('Second screenshot')).toBeVisible()

    await page.getByRole('button', { name: 'Go to image 3' }).click()
    await expect(page.getByAltText('Third screenshot')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Go to image 3' })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await page.getByRole('button', { name: 'Previous image' }).click()
    await expect(page.getByAltText('Second screenshot')).toBeVisible()
  })

  test('returns 404 for an unknown slug', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/projects/does-not-exist')

    expect(response?.status()).toBe(404)
  })
})
