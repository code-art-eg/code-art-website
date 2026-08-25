import { describe, expect, it } from 'vitest'
import type { CodeField, DateField, TextareaField, TextField } from 'payload'

import config from '@/payload.config'
import { Blog } from '@/collections/Blog'
import { getField } from '../helpers/payloadFields'

const slugField = getField(Blog.fields, 'slug') as TextField

const runSlugHook = (args: { value?: unknown; data?: Record<string, unknown> }) => {
  const hook = slugField.hooks?.beforeValidate?.[0]
  if (!hook) throw new Error('Expected a beforeValidate hook on the slug field')
  return hook({ ...args, siblingData: args.data } as never)
}

describe('Blog collection', () => {
  it('uses the "blog" slug and is registered in the Payload config', async () => {
    expect(Blog.slug).toBe('blog')

    const payloadConfig = await config
    const slugs = payloadConfig.collections.map((collection) => collection.slug)
    expect(slugs).toContain('blog')
  })

  it('is publicly readable, titled by the post title and sorted newest first', () => {
    expect(Blog.access?.read?.({} as never)).toBe(true)
    expect(Blog.admin?.useAsTitle).toBe('title')
    expect(Blog.defaultSort).toBe('-publishedAt')
  })

  it('requires a title', () => {
    const title = getField(Blog.fields, 'title') as TextField
    expect(title.type).toBe('text')
    expect(title.required).toBe(true)
  })

  it('defines a required, unique, indexed slug derived from the title', () => {
    expect(slugField.required).toBe(true)
    expect(slugField.unique).toBe(true)
    expect(slugField.index).toBe(true)

    expect(runSlugHook({ value: undefined, data: { title: 'Hello World!' } })).toBe('hello-world')
    expect(runSlugHook({ value: 'Typed Slug', data: {} })).toBe('typed-slug')
  })

  it('rejects slugs that are not url-safe', () => {
    const validate = slugField.validate as (value: unknown) => string | true

    expect(validate('my-post')).toBe(true)
    expect(validate('My Post')).toEqual(expect.any(String))
    expect(validate('')).toEqual(expect.any(String))
  })

  it('requires a summary', () => {
    const summary = getField(Blog.fields, 'summary') as TextareaField
    expect(summary.type).toBe('textarea')
    expect(summary.required).toBe(true)
  })

  it('stores the body as required markdown', () => {
    const content = getField(Blog.fields, 'content') as CodeField

    expect(content.type).toBe('code')
    expect(content.required).toBe(true)
    expect(content.admin?.language).toBe('markdown')
  })

  it('requires an indexed publication date that defaults to now', () => {
    const publishedAt = getField(Blog.fields, 'publishedAt') as DateField

    expect(publishedAt.type).toBe('date')
    expect(publishedAt.required).toBe(true)
    expect(publishedAt.index).toBe(true)

    const defaultValue = publishedAt.defaultValue as () => string
    expect(typeof defaultValue).toBe('function')
    expect(Number.isNaN(Date.parse(defaultValue()))).toBe(false)
  })
})
