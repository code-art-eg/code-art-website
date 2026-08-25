import React from 'react'
import Link from 'next/link'

import type { Blog } from '@/payload-types'
import { formatPostDate } from '@/lib/date'

export type BlogListProps = {
  posts: Blog[]
  emptyMessage?: string
}

/** Chronological list of posts: title link, publication date and summary. */
export const BlogList: React.FC<BlogListProps> = ({
  posts,
  emptyMessage = 'No posts have been published yet.',
}) => {
  if (posts.length === 0) {
    return <p className="text-slate-600 dark:text-slate-400">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {posts.map((post) => (
        <li key={post.id} className="py-6 first:pt-0">
          <article>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              <Link
                href={`/blog/${post.slug}`}
                className="underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none"
              >
                {post.title}
              </Link>
            </h2>

            {post.publishedAt && (
              <time
                dateTime={post.publishedAt}
                className="mt-1 block text-sm text-slate-500 dark:text-slate-500"
              >
                {formatPostDate(post.publishedAt)}
              </time>
            )}

            <p className="mt-2 text-slate-600 dark:text-slate-400">{post.summary}</p>
          </article>
        </li>
      ))}
    </ul>
  )
}

export default BlogList
