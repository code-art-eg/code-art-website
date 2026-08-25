import type { Media, Project, Skill, WorkExperience } from '../../src/payload-types.js'

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

export const makeSkill = (title: string, id = nextId++): Skill => ({
  id,
  title,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
})

export const makeMedia = (overrides: Partial<Media> = {}): Media => ({
  id: nextId++,
  alt: 'A screenshot',
  url: '/api/media/file/screenshot.png',
  filename: 'screenshot.png',
  mimeType: 'image/png',
  filesize: 1024,
  width: 1200,
  height: 675,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: nextId++,
  title: 'Portfolio Site',
  slug: 'portfolio-site',
  summary: 'A personal website built with Payload CMS.',
  description: richText('It renders content from a headless CMS.') as Project['description'],
  externalLink: 'https://example.com',
  githubLink: 'https://github.com/someone/portfolio',
  skills: [makeSkill('TypeScript'), makeSkill('React')],
  images: [],
  highlight: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})
