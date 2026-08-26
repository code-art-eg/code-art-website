import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import type { Project } from '@/payload-types'
import { firstImage } from '@/lib/media'

import { ExternalLinkIcon } from './Icons'
import { SkillBadges } from './SkillBadges'
import { SocialIcon } from './SocialIcon'

export type ProjectCardProps = {
  project: Project
}

/** Neutral stand-in when a project has no images. */
const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div
    role="img"
    aria-label={`${title} (no image)`}
    className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-3xl font-semibold text-slate-400 dark:from-slate-800 dark:to-slate-900 dark:text-slate-600"
  >
    {title.charAt(0).toUpperCase()}
  </div>
)

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const image = firstImage(project.images)

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain"
          />
        ) : (
          <Placeholder title={project.title} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          <Link
            href={`/projects/${project.slug}`}
            className="underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400">{project.summary}</p>

        <SkillBadges skills={project.skills} className="mt-auto pt-2" />

        {(project.externalLink || project.githubLink) && (
          <div className="flex items-center gap-3 pt-1">
            {project.externalLink && (
              <a
                href={project.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${project.title}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
              >
                Live
                <ExternalLinkIcon className="size-3.5" />
              </a>
            )}
            {project.githubLink && (
              <a
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} on GitHub`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-400"
              >
                <SocialIcon platform="github" className="size-3.5" />
                Code
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default ProjectCard
