import { describe, expect, it } from 'vitest'
import type { RichTextField, TextField } from 'payload'

import config from '@/payload.config'
import { Bio } from '@/globals/Bio'
import { getField } from '../helpers/payloadFields'

describe('Bio global', () => {
  it('uses the "bio" slug', () => {
    expect(Bio.slug).toBe('bio')
  })

  it('is publicly readable so the frontend can render it', () => {
    expect(Bio.access?.read?.({} as never)).toBe(true)
  })

  it('is registered in the Payload config', async () => {
    const payloadConfig = await config
    const slugs = payloadConfig.globals.map((global) => global.slug)
    expect(slugs).toContain('bio')
  })

  it('requires a title (the author name)', () => {
    const title = getField(Bio.fields, 'title') as TextField
    expect(title.type).toBe('text')
    expect(title.required).toBe(true)
  })

  it.each(['subtitle', 'shortPhrase'])('defines an optional %s text field', (name) => {
    const field = getField(Bio.fields, name) as TextField
    expect(field.type).toBe('text')
    expect(field.required).toBeFalsy()
  })

  it('defines aboutMe as a rich text field', () => {
    const aboutMe = getField(Bio.fields, 'aboutMe') as RichTextField
    expect(aboutMe.type).toBe('richText')
  })

  it('uses the Lexical editor configured on the root config', async () => {
    const payloadConfig = await config
    const bio = payloadConfig.globals.find((global) => global.slug === 'bio')
    const aboutMe = bio?.fields.find(
      (field) => 'name' in field && field.name === 'aboutMe',
    ) as RichTextField

    // Payload injects the root `editor` into richText fields that do not declare their own.
    expect(aboutMe.editor).toBeDefined()
  })
})
