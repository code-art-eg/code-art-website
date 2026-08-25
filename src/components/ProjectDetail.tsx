import React from 'react'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Project } from '@/payload-types'
import { populatedMedia } from '@/lib/media'

import { ExternalLinkIcon } from './Icons'
import { ProjectGallery } from './ProjectGallery'
import { SkillBadges } from './SkillBadges'
import { SocialIcon } from './SocialIcon'

export type ProjectDetailProps = {
  project: Project
}

/**
 * Full project page body: heading, summary, links, skills, gallery and rich text description.
 */
export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project }) => {
  const images = populatedMedia(project.images)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/projects"
        className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
      >
        ← Back to projects
      </Link>

      <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white">
        {project.title}
      </h1>

      <p className="mt-3 text-lg text-pretty text-slate-600 dark:text-slate-400">
        {project.summary}
      </p>

      {(project.externalLink || project.githubLink) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {project.externalLink && (
            <a
              href={project.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Visit project
              <ExternalLinkIcon className="size-4" />
            </a>
          )}

          {project.githubLink && (
            <a
              href={project.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <SocialIcon platform="github" className="size-4" />
              View source
            </a>
          )}
        </div>
      )}

      <SkillBadges skills={project.skills} className="mt-6" />

      <ProjectGallery images={images} title={project.title} />

      <RichText
        data={project.description}
        className="prose prose-slate dark:prose-invert prose-a:text-sky-700 dark:prose-a:text-sky-400 mt-8 max-w-none"
      />
    </article>
  )
}

export default ProjectDetail
