import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Bio } from '@/payload-types'

export type BioSectionProps = {
  title: Bio['title']
  subtitle?: Bio['subtitle']
  shortPhrase?: Bio['shortPhrase']
  aboutMe?: Bio['aboutMe']
}

/**
 * Home page hero (name, role, tagline) followed by the rich text "About me" section.
 * Presentational only — the page fetches the `bio` global and passes it in.
 */
export const BioSection: React.FC<BioSectionProps> = ({
  title,
  subtitle,
  shortPhrase,
  aboutMe,
}) => (
  <section id="about" aria-labelledby="about-heading" className="scroll-mt-24">
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center sm:pt-28">
      <h1
        id="about-heading"
        className="text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-6xl dark:text-white"
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-4 text-xl font-medium text-sky-700 sm:text-2xl dark:text-sky-400">
          {subtitle}
        </p>
      )}

      {shortPhrase && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty text-slate-600 dark:text-slate-400">
          {shortPhrase}
        </p>
      )}
    </div>

    {aboutMe && (
      <div className="mx-auto max-w-3xl px-6 pb-16">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          About me
        </h2>
        <RichText
          data={aboutMe}
          className="prose prose-slate max-w-none dark:prose-invert prose-a:text-sky-700 dark:prose-a:text-sky-400"
        />
      </div>
    )}
  </section>
)

export default BioSection
