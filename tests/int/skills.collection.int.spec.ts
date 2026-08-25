import { describe, expect, it } from 'vitest'
import type { TextField } from 'payload'

import config from '@/payload.config'
import { Skills } from '@/collections/Skills'
import { getField } from '../helpers/payloadFields'

describe('Skills collection', () => {
  it('uses the "skills" slug', () => {
    expect(Skills.slug).toBe('skills')
  })

  it('is publicly readable and registered in the Payload config', async () => {
    expect(Skills.access?.read?.({} as never)).toBe(true)

    const payloadConfig = await config
    const slugs = payloadConfig.collections.map((collection) => collection.slug)
    expect(slugs).toContain('skills')
  })

  it('uses the title as the admin label', () => {
    expect(Skills.admin?.useAsTitle).toBe('title')
  })

  it('defines a required, unique, indexed title', () => {
    const title = getField(Skills.fields, 'title') as TextField

    expect(title.type).toBe('text')
    expect(title.required).toBe(true)
    expect(title.unique).toBe(true)
    expect(title.index).toBe(true)
  })

  it('lists skills alphabetically by default', () => {
    expect(Skills.defaultSort).toBe('title')
  })
})
