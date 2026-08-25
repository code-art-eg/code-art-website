import React from 'react'
import type { Metadata } from 'next'

import { BlogList } from '@/components/BlogList'
import { Pagination } from '@/components/Pagination'
import { YearFilter } from '@/components/YearFilter'
import { BLOG_POSTS_PER_PAGE, getPostYears, getPosts } from '@/lib/collections'
import { parsePositiveInt, parseYearParam } from '@/lib/pagination'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles and notes on software engineering.',
}

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogPage({ searchParams }: PageProps) {
  const query = await searchParams
  const page = parsePositiveInt(query.page, 1)
  const limit = parsePositiveInt(query.limit, BLOG_POSTS_PER_PAGE)

  const years = await getPostYears()
  const year = parseYearParam(query.year, years)

  const { docs, totalPages } = await getPosts({ page, limit, year })

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Blog
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Articles and notes on software engineering.
        </p>
      </header>

      <div className="mb-8">
        <YearFilter years={years} selected={year} />
      </div>

      <BlogList
        posts={docs}
        emptyMessage={
          year ? `No posts were published in ${year}.` : 'No posts have been published yet.'
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/blog"
        params={{
          year: year ?? undefined,
          limit: limit === BLOG_POSTS_PER_PAGE ? undefined : limit,
        }}
        label="Blog pagination"
      />
    </div>
  )
}
