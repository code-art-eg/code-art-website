import { describe, expect, it } from 'vitest'
import type { ArrayField, SelectField, TextField } from 'payload'

import config from '@/payload.config'
import { Footer } from '@/globals/Footer'
import { getField, getSubField, optionValues } from '../helpers/payloadFields'

describe('Footer global', () => {
  it('uses the "footer" slug', () => {
    expect(Footer.slug).toBe('footer')
  })

  it('is publicly readable so the frontend can render it', () => {
    expect(Footer.access?.read?.({} as never)).toBe(true)
  })

  it('is registered in the Payload config', async () => {
    const payloadConfig = await config
    const slugs = payloadConfig.globals.map((global) => global.slug)
    expect(slugs).toContain('footer')
  })

  it('defines a copyright text field', () => {
    const copyright = getField(Footer.fields, 'copyright') as TextField
    expect(copyright.type).toBe('text')
  })

  describe('socialLinks', () => {
    const socialLinks = getField(Footer.fields, 'socialLinks') as ArrayField

    it('is an array field', () => {
      expect(socialLinks.type).toBe('array')
    })

    it('offers the supported platforms', () => {
      const platform = getSubField(socialLinks, 'platform') as SelectField
      expect(platform.type).toBe('select')
      expect(optionValues(platform)).toEqual(['github', 'linkedin', 'facebook', 'twitter', 'x'])
    })

    it('requires a platform and a url', () => {
      expect(getSubField(socialLinks, 'platform').required).toBe(true)
      expect(getSubField(socialLinks, 'url').required).toBe(true)
    })

    it('rejects urls that are missing or not absolute http(s) urls', () => {
      const url = getSubField(socialLinks, 'url') as TextField
      const validate = url.validate as (value: unknown) => string | true

      expect(validate(undefined)).toEqual(expect.any(String))
      expect(validate('')).toEqual(expect.any(String))
      expect(validate('github.com/someone')).toEqual(expect.any(String))
      expect(validate('ftp://example.com')).toEqual(expect.any(String))
      expect(validate('https://github.com/someone')).toBe(true)
      expect(validate('http://example.com')).toBe(true)
    })
  })
})
