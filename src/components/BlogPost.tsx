import React from 'react'
import Link from 'next/link'

import type { Blog } from '@/payload-types'
import { formatPostDate } from '@/lib/date'

import { Markdown } from './Markdown'

export type BlogPostProps = {
  post: Blog
}

/** Full blog post: title, publication date, summary and rendered Markdown body. */
export const BlogPost: React.FC<BlogPostProps> = ({ post }) => (
  <article className="mx-auto max-w-3xl px-6 py-12">
    <Link
      href="/blog"
      className="text-sm font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-400"
    >
      ← Back to blog
    </Link>

    <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl dark:text-white">
      {post.title}
    </h1>

    {post.publishedAt && (
      <time
        dateTime={post.publishedAt}
        className="mt-3 block text-sm text-slate-500 dark:text-slate-500"
      >
        {formatPostDate(post.publishedAt)}
      </time>
    )}

    <p className="mt-4 text-lg text-pretty text-slate-600 dark:text-slate-400">{post.summary}</p>

    <hr className="my-8 border-slate-200 dark:border-slate-800" />

    <Markdown>{post.content}</Markdown>
  </article>
)

export default BlogPost
