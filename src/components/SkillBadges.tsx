import React from 'react'

import type { Project } from '@/payload-types'

export type SkillBadgesProps = {
  skills?: Project['skills'] | null
  className?: string
}

/**
 * Renders the populated `skills` relationship as badges. Unpopulated entries
 * (plain ids, when the query used `depth: 0`) are skipped.
 */
export const SkillBadges: React.FC<SkillBadgesProps> = ({ skills, className }) => {
  const titles = (skills ?? [])
    .filter((skill) => typeof skill === 'object' && skill !== null)
    .map((skill) => skill.title)
    .filter(Boolean)

  if (titles.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ''}`} aria-label="Skills">
      {titles.map((title) => (
        <li
          key={title}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          {title}
        </li>
      ))}
    </ul>
  )
}

export default SkillBadges
