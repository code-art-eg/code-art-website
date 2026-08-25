import { describe, expect, it } from 'vitest'
import type { NumberField, RichTextField, TextField } from 'payload'

import config from '@/payload.config'
import { WorkExperience } from '@/collections/WorkExperience'
import { getField } from '../helpers/payloadFields'

const validatorFor = (name: string) =>
  getField(WorkExperience.fields, name).validate as (value: unknown) => string | true

describe('WorkExperience collection', () => {
  it('uses the "work-experience" slug', () => {
    expect(WorkExperience.slug).toBe('work-experience')
  })

  it('is publicly readable and registered in the Payload config', async () => {
    expect(WorkExperience.access?.read?.({} as never)).toBe(true)

    const payloadConfig = await config
    const slugs = payloadConfig.collections.map((collection) => collection.slug)
    expect(slugs).toContain('work-experience')
  })

  it('shows the job title in the admin list and sorts newest first', () => {
    expect(WorkExperience.admin?.useAsTitle).toBe('jobTitle')
    expect(WorkExperience.defaultSort).toBe('-startYear')
  })

  it.each(['jobTitle', 'company'])('requires %s', (name) => {
    const field = getField(WorkExperience.fields, name) as TextField
    expect(field.type).toBe('text')
    expect(field.required).toBe(true)
  })

  it.each(['companyUrl', 'location'])('defines %s as optional text', (name) => {
    const field = getField(WorkExperience.fields, name) as TextField
    expect(field.type).toBe('text')
    expect(field.required).toBeFalsy()
  })

  it('requires a start year and leaves the end year optional', () => {
    const startYear = getField(WorkExperience.fields, 'startYear') as NumberField
    const endYear = getField(WorkExperience.fields, 'endYear') as NumberField

    expect(startYear.type).toBe('number')
    expect(startYear.required).toBe(true)
    expect(endYear.type).toBe('number')
    expect(endYear.required).toBeFalsy()
  })

  it('requires a rich text job description', () => {
    const jobDescription = getField(WorkExperience.fields, 'jobDescription') as RichTextField
    expect(jobDescription.type).toBe('richText')
    expect(jobDescription.required).toBe(true)
  })

  describe('year validation', () => {
    it('accepts realistic years', () => {
      expect(validatorFor('startYear')(2019)).toBe(true)
      expect(validatorFor('endYear')(2024)).toBe(true)
    })

    it('rejects non-integers and out-of-range years', () => {
      expect(validatorFor('startYear')(2019.5)).toEqual(expect.any(String))
      expect(validatorFor('startYear')(202)).toEqual(expect.any(String))
      expect(validatorFor('startYear')(9999)).toEqual(expect.any(String))
    })

    it('treats an empty end year as "Present" but still demands a start year', () => {
      expect(validatorFor('endYear')(null)).toBe(true)
      expect(validatorFor('endYear')(undefined)).toBe(true)
      expect(validatorFor('startYear')(null)).toEqual(expect.any(String))
    })
  })

  describe('company url validation', () => {
    it('allows an empty value', () => {
      expect(validatorFor('companyUrl')(undefined)).toBe(true)
      expect(validatorFor('companyUrl')('')).toBe(true)
    })

    it('requires an absolute http(s) url when present', () => {
      expect(validatorFor('companyUrl')('https://example.com')).toBe(true)
      expect(validatorFor('companyUrl')('example.com')).toEqual(expect.any(String))
      expect(validatorFor('companyUrl')('ftp://example.com')).toEqual(expect.any(String))
    })
  })
})
