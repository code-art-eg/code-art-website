import React from 'react'

import { Footer } from '@/components/Footer'
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
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <Footer copyright={footer?.copyright} socialLinks={footer?.socialLinks} />
      </body>
    </html>
  )
}
