import React from 'react'

import { getPayloadClient } from '@/lib/payload'

export default async function HomePage() {
  const payload = await getPayloadClient()
  const adminRoute = payload.config.routes.admin

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        Welcome
      </h1>
      <p className="max-w-prose text-lg text-slate-600 dark:text-slate-400">
        This site is powered by Payload CMS. Sign in to the admin panel to add your bio, work
        experience, projects and blog posts.
      </p>
      <a
        href={adminRoute}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        Go to admin panel
      </a>
    </div>
  )
}
