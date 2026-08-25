import React from 'react'
import Link from 'next/link'

import type { Blog } from '@/payload-types'

import { BlogList } from './BlogList'

export type LatestPostsProps = {
  posts: Blog[]
}

/**
 * Home page "Blog" section: the most recent posts plus a link to the full archive.
 */
export const LatestPosts: React.FC<LatestPostsProps> = ({ posts }) => {
  if (posts.length === 0) return null

  return (
    <section
      id="blog"
      aria-labelledby="blog-heading"
      className="mx-auto max-w-3xl scroll-mt-24 px-6 py-16"
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h2
          id="blog-heading"
          className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white"
        >
          Blog
        </h2>

        <Link
          href="/blog"
          className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-400"
        >
          View all blog posts →
        </Link>
      </div>

      <BlogList posts={posts} />
    </section>
  )
}

export default LatestPosts
