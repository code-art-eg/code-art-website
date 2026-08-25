import type { WorkExperience } from '../../src/payload-types.js'

import { lexicalParagraphs } from './lexical'

type RichText = WorkExperience['jobDescription']

export const richText = (...paragraphs: string[]): RichText =>
  lexicalParagraphs(...paragraphs) as unknown as RichText

let nextId = 1

/** Builds a WorkExperience doc for component tests. */
export const makeExperience = (overrides: Partial<WorkExperience> = {}): WorkExperience => ({
  id: nextId++,
  jobTitle: 'Senior Software Engineer',
  company: 'Acme Corp',
  companyUrl: 'https://acme.example.com',
  location: 'Remote',
  startYear: 2020,
  endYear: 2023,
  jobDescription: richText('Built and maintained the platform.'),
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})
