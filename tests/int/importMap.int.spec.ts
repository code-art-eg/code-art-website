import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Field, PayloadComponent, SanitizedConfig } from 'payload'

import { describe, it, beforeAll, expect } from 'vitest'

import config from '@/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const importMapPath = path.resolve(dirname, '../../src/app/(payload)/admin/importMap.js')

/**
 * The admin panel renders custom field components by looking their path up in the generated
 * import map. A field whose component is missing from the map silently renders as nothing —
 * which is how the rich text editor disappeared from the admin panel once before. These tests
 * fail whenever `bun run generate:importmap` has not been re-run after a config change.
 */

/** Recurses through every container that can nest fields, presentational or not. */
const allFields = (fields: Field[]): Field[] =>
  fields.flatMap((field) => {
    switch (field.type) {
      case 'row':
      case 'collapsible':
      case 'array':
      case 'group':
        return [field, ...allFields(field.fields)]
      case 'tabs':
        return [field, ...field.tabs.flatMap((tab) => allFields(tab.fields))]
      case 'blocks':
        return [field, ...field.blocks.flatMap((block) => allFields(block.fields))]
      default:
        return [field]
    }
  })

/** A component reference is either the path itself or an object carrying one. */
const componentPath = (component: PayloadComponent | undefined): string | undefined => {
  if (typeof component === 'string') {
    return component
  }
  if (component && typeof component === 'object' && typeof component.path === 'string') {
    return component.path
  }
  return undefined
}

/** Every component path the admin panel needs in order to render the configured rich text fields. */
const richTextComponentPaths = (sanitized: SanitizedConfig): string[] => {
  const fieldLists = [
    ...sanitized.collections.map((collection) => collection.fields),
    ...sanitized.globals.map((global) => global.fields),
  ]

  const paths = fieldLists
    .flatMap((fields) => allFields(fields))
    .filter((field) => field.type === 'richText')
    .flatMap((field) => {
      const editor = field.editor as Record<string, unknown> | undefined
      return [
        componentPath(editor?.FieldComponent as PayloadComponent),
        componentPath(editor?.CellComponent as PayloadComponent),
      ]
    })
    .filter((value): value is string => typeof value === 'string')

  return [...new Set(paths)]
}

let sanitized: SanitizedConfig
let importMapSource: string

describe('admin import map', () => {
  beforeAll(async () => {
    sanitized = await config
    importMapSource = readFileSync(importMapPath, 'utf-8')
  })

  it('covers every rich text component the config references', () => {
    const required = richTextComponentPaths(sanitized)

    // Guards the guard: if this is empty the assertion below would pass vacuously.
    expect(required.length).toBeGreaterThan(0)

    const missing = required.filter((componentPath) => !importMapSource.includes(componentPath))

    expect(missing, `Missing from importMap.js — run "bun run generate:importmap".`).toStrictEqual(
      [],
    )
  })

  it('registers the lexical field entry that renders the editor', () => {
    expect(importMapSource).toContain('@payloadcms/richtext-lexical/rsc#RscEntryLexicalField')
  })

  it('registers the client components for the default lexical toolbar', () => {
    // A field entry alone is not enough: the toolbar features are separate client components,
    // and a partially stale map renders an editor with no formatting controls.
    for (const feature of ['BoldFeatureClient', 'HeadingFeatureClient', 'LinkFeatureClient']) {
      expect(importMapSource).toContain(`@payloadcms/richtext-lexical/client#${feature}`)
    }
  })
})
