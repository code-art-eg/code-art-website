import { describe, expect, it } from 'vitest'
import type { CheckboxField, RelationshipField, RichTextField, TextField } from 'payload'

import config from '@/payload.config'
import { Projects } from '@/collections/Projects'
import { slugify } from '@/lib/slug'
import { getField } from '../helpers/payloadFields'

const slugField = getField(Projects.fields, 'slug') as TextField

/** Runs the slug field's beforeValidate hook the way Payload would. */
const runSlugHook = (args: { value?: unknown; data?: Record<string, unknown> }) => {
  const hook = slugField.hooks?.beforeValidate?.[0]
  if (!hook) throw new Error('Expected a beforeValidate hook on the slug field')
  return hook({ ...args, siblingData: args.data } as never)
}

describe('slugify', () => {
  it('lowercases, strips punctuation and collapses separators', () => {
    expect(slugify('My  Cool Project!')).toBe('my-cool-project')
  })

  it('folds accented characters', () => {
    expect(slugify('Café Münster')).toBe('cafe-munster')
  })

  it('trims leading and trailing separators', () => {
    expect(slugify('  --Hello--  ')).toBe('hello')
  })
})

describe('Projects collection', () => {
  it('uses the "projects" slug and is registered in the Payload config', async () => {
    expect(Projects.slug).toBe('projects')

    const payloadConfig = await config
    const slugs = payloadConfig.collections.map((collection) => collection.slug)
    expect(slugs).toContain('projects')
  })

  it('is publicly readable and titled by the project title', () => {
    expect(Projects.access?.read?.({} as never)).toBe(true)
    expect(Projects.admin?.useAsTitle).toBe('title')
  })

  it.each(['title', 'summary'])('requires %s as text', (name) => {
    const field = getField(Projects.fields, name) as TextField
    expect(field.type).toBe('text')
    expect(field.required).toBe(true)
  })

  it('requires a rich text description', () => {
    const description = getField(Projects.fields, 'description') as RichTextField
    expect(description.type).toBe('richText')
    expect(description.required).toBe(true)
  })

  it('defines a required, unique, indexed slug', () => {
    expect(slugField.type).toBe('text')
    expect(slugField.required).toBe(true)
    expect(slugField.unique).toBe(true)
    expect(slugField.index).toBe(true)
  })

  describe('slug generation', () => {
    it('derives the slug from the title when none is given', () => {
      expect(runSlugHook({ value: undefined, data: { title: 'My Cool Project' } })).toBe(
        'my-cool-project',
      )
    })

    it('normalises a slug that was typed by hand', () => {
      expect(runSlugHook({ value: 'My Typed Slug', data: { title: 'Ignored' } })).toBe(
        'my-typed-slug',
      )
    })

    it('leaves the value alone when there is nothing to derive from', () => {
      expect(runSlugHook({ value: undefined, data: {} })).toBeUndefined()
    })
  })

  describe('slug validation', () => {
    const validate = slugField.validate as (value: unknown) => string | true

    it('accepts url-safe slugs', () => {
      expect(validate('my-project')).toBe(true)
      expect(validate('project2')).toBe(true)
    })

    it('rejects empty, uppercase, spaced or doubly-hyphenated slugs', () => {
      expect(validate('')).toEqual(expect.any(String))
      expect(validate('My-Project')).toEqual(expect.any(String))
      expect(validate('my project')).toEqual(expect.any(String))
      expect(validate('my--project')).toEqual(expect.any(String))
      expect(validate('-my-project')).toEqual(expect.any(String))
    })
  })

  describe('links', () => {
    it.each(['externalLink', 'githubLink'])('validates %s as an optional absolute url', (name) => {
      const validate = getField(Projects.fields, name).validate as (value: unknown) => string | true

      expect(validate(undefined)).toBe(true)
      expect(validate('')).toBe(true)
      expect(validate('https://example.com')).toBe(true)
      expect(validate('example.com')).toEqual(expect.any(String))
    })
  })

  describe('relationships', () => {
    it('requires at least one skill', () => {
      const skills = getField(Projects.fields, 'skills') as RelationshipField

      expect(skills.type).toBe('relationship')
      expect(skills.relationTo).toBe('skills')
      expect(skills.hasMany).toBe(true)
      expect(skills.required).toBe(true)
      expect(skills.admin?.isSortable).toBe(true)
    })

    it('edits skills through the tag input rather than the stock relationship field', () => {
      // The tag input creates missing skills as the editor types; losing this component
      // silently puts the "+" document drawer back.
      const skills = getField(Projects.fields, 'skills') as RelationshipField

      expect(skills.admin?.components?.Field).toBe(
        '@/components/admin/SkillsTagInput#SkillsTagInput',
      )
    })

    it('allows optional media images', () => {
      const images = getField(Projects.fields, 'images') as RelationshipField

      expect(images.type).toBe('relationship')
      expect(images.relationTo).toBe('media')
      expect(images.hasMany).toBe(true)
      expect(images.required).toBeFalsy()
    })
  })

  it('defaults highlight to false', () => {
    const highlight = getField(Projects.fields, 'highlight') as CheckboxField

    expect(highlight.type).toBe('checkbox')
    expect(highlight.defaultValue).toBe(false)
  })
})
