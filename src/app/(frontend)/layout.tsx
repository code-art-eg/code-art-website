import React from 'react'

import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'
import { getFooter } from '@/lib/globals'

import './styles.css'

/**
 * The whole frontend reads live content from Payload, so it must render per request
 * instead of being frozen into the production build.
 */
export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Personal website, portfolio and blog of a software engineer.',
  title: 'Personal Website',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const footer = await getFooter()

  return (
    // `data-scroll-behavior` lets Next suspend our global smooth scrolling during route
    // transitions, so navigating pages jumps instantly while in-page anchors still glide.
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        <Nav />
        <main className="flex-1 pt-16">{children}</main>
        <Footer copyright={footer?.copyright} socialLinks={footer?.socialLinks} />
      </body>
    </html>
  )
}
