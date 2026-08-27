import { describe, expect, it } from 'vitest'
import type { GlobalConfig, RelationshipField } from 'payload'

import config from '@/payload.config'
import { HomePageProjects } from '@/globals/HomePageProjects'
import { ProjectPageProjects } from '@/globals/ProjectPageProjects'
import { getField } from '../helpers/payloadFields'

/**
 * Both globals curate a list of projects: they decide which projects a page shows and the
 * order they appear in. They are configured identically, so the schema is asserted once.
 */
const curations: [string, GlobalConfig, string][] = [
  ['HomePageProjects', HomePageProjects, 'home-page-projects'],
  ['ProjectPageProjects', ProjectPageProjects, 'project-page-projects'],
]

describe.each(curations)('%s global', (_name, global, slug) => {
  it(`uses the "${slug}" slug`, () => {
    expect(global.slug).toBe(slug)
  })

  it('is publicly readable so the frontend can render it', () => {
    expect(global.access?.read?.({} as never)).toBe(true)
  })

  it('is registered in the Payload config', async () => {
    const payloadConfig = await config
    const slugs = payloadConfig.globals.map((registered) => registered.slug)
    expect(slugs).toContain(slug)
  })

  it('holds an ordered, sortable list of projects', () => {
    const projects = getField(global.fields, 'projects') as RelationshipField

    expect(projects.type).toBe('relationship')
    expect(projects.relationTo).toBe('projects')
    expect(projects.hasMany).toBe(true)
    // Sorting the list is the whole point: the page renders it in this order.
    expect(projects.admin?.isSortable).toBe(true)
  })

  it('does not let editors create projects from the picker', () => {
    const projects = getField(global.fields, 'projects') as RelationshipField

    // Curating is choosing among existing projects; new ones are authored in the collection.
    expect(projects.admin?.allowCreate).toBe(false)
  })

  it('is optional, so an empty curation is a valid saved state', () => {
    const projects = getField(global.fields, 'projects') as RelationshipField

    expect(projects.required).toBeFalsy()
  })
})

describe('project curation globals', () => {
  it('are two distinct globals, so each page is curated on its own', () => {
    expect(HomePageProjects.slug).not.toBe(ProjectPageProjects.slug)
  })
})
