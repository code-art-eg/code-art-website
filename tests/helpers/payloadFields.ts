import type { ArrayField, Field, SelectField } from 'payload'

type NamedField = Extract<Field, { name: string }>

const hasName = (field: Field): field is NamedField => 'name' in field

/**
 * Finds a top-level field by name inside a collection/global field list.
 */
export const findField = (fields: Field[], name: string): NamedField | undefined =>
  fields.filter(hasName).find((field) => field.name === name)

/**
 * Finds a field by name and asserts it exists, so tests read cleanly.
 */
export const getField = (fields: Field[], name: string): NamedField => {
  const field = findField(fields, name)
  if (!field) {
    throw new Error(`Expected a field named "${name}" but found none.`)
  }
  return field
}

/**
 * Finds a nested field by name inside an array/group field.
 */
export const getSubField = (field: ArrayField, name: string): NamedField =>
  getField(field.fields, name)

/**
 * Normalises select options (string | { label, value }) down to their values.
 */
export const optionValues = (field: SelectField): string[] =>
  field.options.map((option) => (typeof option === 'string' ? option : option.value))
