'use client'

import type { RelationshipFieldClientComponent, Validate } from 'payload'

import type { ReactSelectOption } from '@payloadcms/ui'
import {
  fieldBaseClass,
  FieldDescription,
  FieldError,
  FieldLabel,
  ReactSelect,
  RenderCustomComponent,
  toast,
  useConfig,
  useField,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  normalizeSkillTitle,
  resolveSkillSelection,
  sortSkillOptions,
  type SkillId,
  type SkillOption,
} from '@/lib/skillOptions'

const baseClass = 'skills-tag-input'

/**
 * The skills picker on the Projects edit view.
 *
 * Payload's stock relationship field can create related documents, but only through a "+" button
 * that opens a whole document drawer — far too much ceremony for a collection whose only field is
 * a title. This replaces it with a tag input: type a name, and either pick the skill that already
 * exists or press Enter to create it and have it selected in one go.
 *
 * The field still stores exactly what the relationship stores — an array of `skills` ids — so
 * nothing downstream (the API, `src/lib/collections.ts`, the frontend) has to know about this.
 */
export const SkillsTagInput: RelationshipFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, isSortable = true, placeholder } = {},
      label,
      required,
    },
    path: pathFromProps,
    readOnly,
    validate,
  } = props

  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()

  const memoizedValidate = useCallback<Validate>(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value as never, { ...validationOptions, required } as never)
      }
      return true
    },
    [validate, required],
  )

  const {
    // `Error` is aliased because the destructured name would shadow the global constructor.
    customComponents: { Description, Error: ErrorComponent, Label } = {},
    disabled,
    path,
    setValue,
    showError,
    value,
  } = useField<SkillId[]>({ potentiallyStalePath: pathFromProps, validate: memoizedValidate })

  const [options, setOptions] = useState<SkillOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  /**
   * `handleChange` awaits the create request, by which time the `options` it closed over may be
   * stale — a second skill typed in quick succession would not see the first one. The ref always
   * holds the current list.
   */
  const optionsRef = useRef<SkillOption[]>([])

  const commitOptions = useCallback((next: SkillOption[]) => {
    const sorted = sortSkillOptions(next)
    optionsRef.current = sorted
    setOptions(sorted)
  }, [])

  const skillsURL = `${serverURL}${api}/skills`

  useEffect(() => {
    const controller = new AbortController()

    const loadSkills = async () => {
      try {
        // `limit=0` returns every skill: the collection holds a handful of rows, so loading it
        // once up front makes the type-ahead instant and lets us spot an existing title without
        // a round trip on every keystroke.
        const response = await fetch(`${skillsURL}?depth=0&limit=0&sort=title`, {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Skills request failed with status ${response.status}`)

        const data = (await response.json()) as { docs?: { id: SkillId; title: string }[] }
        const loaded = (data.docs ?? []).map((doc) => ({ label: doc.title, value: doc.id }))

        const sorted = sortSkillOptions(loaded)
        optionsRef.current = sorted
        setOptions(sorted)
        setIsLoading(false)
      } catch {
        if (controller.signal.aborted) return
        setIsLoading(false)
        toast.error('Could not load the list of skills.')
      }
    }

    void loadSkills()

    return () => controller.abort()
  }, [skillsURL])

  /** Looks a title up on the server, for when a create failed because the skill already existed. */
  const findRemoteSkill = useCallback(
    async (title: string): Promise<SkillOption | null> => {
      try {
        const query = `where[title][equals]=${encodeURIComponent(title)}&depth=0&limit=1`
        const response = await fetch(`${skillsURL}?${query}`, { credentials: 'include' })
        if (!response.ok) return null

        const data = (await response.json()) as { docs?: { id: SkillId; title: string }[] }
        const doc = data.docs?.[0]
        return doc ? { label: doc.title, value: doc.id } : null
      } catch {
        return null
      }
    },
    [skillsURL],
  )

  const createSkill = useCallback(
    async (title: string): Promise<SkillOption | null> => {
      let created: SkillOption | null = null

      try {
        const response = await fetch(skillsURL, {
          body: JSON.stringify({ title }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const data = (await response.json().catch(() => null)) as {
          doc?: { id: SkillId; title: string }
        } | null

        if (response.ok && data?.doc) {
          created = { label: data.doc.title, value: data.doc.id }
        }
      } catch {
        // Fall through to the lookup below.
      }

      // A unique-title clash means someone (or another tab) created it first — reuse that row
      // rather than telling the editor their skill could not be added.
      created ??= await findRemoteSkill(title)

      if (!created) {
        toast.error(`Could not add the skill "${title}".`)
        return null
      }

      if (!optionsRef.current.some((option) => option.value === created.value)) {
        commitOptions([...optionsRef.current, created])
      }

      return created
    },
    [commitOptions, findRemoteSkill, skillsURL],
  )

  const handleChange = useCallback(
    async (selected: ReactSelectOption | ReactSelectOption[]) => {
      const selectedOptions = Array.isArray(selected) ? selected : selected ? [selected] : []

      setIsSaving(true)

      try {
        setValue(
          await resolveSkillSelection({
            createSkill,
            known: optionsRef.current,
            selected: selectedOptions.map((option) => option.value as SkillId),
          }),
        )
      } finally {
        setIsSaving(false)
      }
    },
    [createSkill, setValue],
  )

  const selectedOptions = useMemo(() => {
    if (!Array.isArray(value)) return []

    // Display only: ids whose skill has not loaded yet are skipped here, never from the value.
    return value.flatMap((id) => options.filter((option) => option.value === id))
  }, [options, value])

  /**
   * react-select asks whether each option matches the search text. Payload's creatable select
   * reuses the same callback as a probe (with a `null` option) when Enter or Tab is pressed, to
   * decide whether to turn the raw text into a value immediately. Declining the probe hands Enter
   * back to react-select, so typing "Typ" and pressing Enter selects the highlighted "TypeScript"
   * instead of creating a skill called "Typ".
   */
  const filterOption = useCallback(
    (option: { data?: unknown; label?: string } | null, search: string) => {
      if (!option) return false
      if ((option.data as { __isNew__?: boolean } | undefined)?.__isNew__) return true

      const term = normalizeSkillTitle(search).toLowerCase()
      if (!term) return true

      return normalizeSkillTitle(option.label ?? '')
        .toLowerCase()
        .includes(term)
    },
    [],
  )

  const styles = useMemo(() => field?.admin?.style, [field])

  return (
    <div
      className={[fieldBaseClass, baseClass, className, showError && 'error']
        .filter(Boolean)
        .join(' ')}
      id={`field-${path.replace(/\./g, '__')}`}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={<FieldLabel label={label} path={path} required={required} />}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent
          CustomComponent={ErrorComponent}
          Fallback={<FieldError path={path} showError={showError} />}
        />
        <ReactSelect
          disabled={readOnly || disabled}
          filterOption={filterOption as never}
          isCreatable
          isLoading={isLoading || isSaving}
          isMulti
          isSortable={isSortable}
          onChange={handleChange}
          options={options}
          placeholder={placeholder ?? 'Type a skill and press Enter'}
          showError={showError}
          value={selectedOptions}
        />
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </div>
  )
}

export default SkillsTagInput
