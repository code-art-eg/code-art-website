'use client'

import React, { useCallback, useState } from 'react'

import type { Media } from '@/payload-types'

import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { ZoomableImage } from './ZoomableImage'

export type ProjectGalleryProps = {
  images: Media[]
  title: string
}

/**
 * Image carousel with previous/next controls and dot indicators.
 * Renders a single static image (no controls) when there is only one.
 * Clicking the current image opens it full screen.
 */
export const ProjectGallery: React.FC<ProjectGalleryProps> = ({ images, title }) => {
  const [index, setIndex] = useState(0)
  const count = images.length

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count])

  if (count === 0) return null

  const current = images[index]

  return (
    <section aria-roledescription="carousel" aria-label={`${title} images`} className="mt-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900">
        {current.url && (
          <ZoomableImage
            key={current.id}
            src={current.url}
            alt={current.alt || title}
            sizes="(max-width: 768px) 100vw, 768px"
            priority={index === 0}
          />
        )}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <>
          <p aria-live="polite" className="sr-only">
            {`Image ${index + 1} of ${count}`}
          </p>
          <ul className="mt-3 flex justify-center gap-2">
            {images.map((image, dotIndex) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => go(dotIndex)}
                  aria-label={`Go to image ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? 'true' : undefined}
                  className={`size-2.5 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    dotIndex === index
                      ? 'bg-sky-600 dark:bg-sky-400'
                      : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default ProjectGallery
