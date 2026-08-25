import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { WorkExperience } from '@/payload-types'

export type ExperienceListProps = {
  items: WorkExperience[]
}

/** "2019 — Present" / "2016 — 2019" / "2019" */
export const formatYearRange = (startYear: number, endYear?: number | null): string => {
  if (!endYear) return `${startYear} — Present`
  if (endYear === startYear) return `${startYear}`
  return `${startYear} — ${endYear}`
}

const CompanyName: React.FC<{ item: WorkExperience }> = ({ item }) =>
  item.companyUrl ? (
    <a
      href={item.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
    >
      {item.company}
    </a>
  ) : (
    <span className="font-medium text-slate-700 dark:text-slate-300">{item.company}</span>
  )

/**
 * Vertical timeline of roles. Presentational only — the page fetches and sorts the data.
 */
export const ExperienceList: React.FC<ExperienceListProps> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="mx-auto max-w-3xl scroll-mt-24 px-6 py-16"
    >
      <h2
        id="experience-heading"
        className="mb-10 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        Experience
      </h2>

      <ol className="relative border-l border-slate-200 dark:border-slate-800">
        {items.map((item) => (
          <li key={item.id} className="mb-10 ml-6 last:mb-0">
            <span
              aria-hidden="true"
              className="absolute -left-[5px] mt-2 size-2.5 rounded-full bg-sky-600 ring-4 ring-white dark:bg-sky-400 dark:ring-slate-950"
            />

            <article>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {item.jobTitle}
              </h3>

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                <CompanyName item={item} />
                {item.location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{item.location}</span>
                  </>
                )}
              </p>

              <p className="mt-1 font-mono text-xs tracking-wide text-slate-500 uppercase dark:text-slate-500">
                {formatYearRange(item.startYear, item.endYear)}
              </p>

              <RichText
                data={item.jobDescription}
                className="prose prose-slate prose-sm dark:prose-invert prose-a:text-sky-700 dark:prose-a:text-sky-400 mt-3 max-w-none"
              />
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default ExperienceList
