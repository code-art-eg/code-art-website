'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

import { CloseIcon } from './Icons'

export type ZoomableImageProps = {
  src: string
  alt: string
  /** `sizes` for the inline copy; the zoomed one always fills the viewport. */
  sizes: string
  priority?: boolean
}

type LightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

/** Full-screen overlay holding the zoomed image. Rendered into `document.body`. */
const Lightbox: React.FC<LightboxProps> = ({ src, alt, onClose }) => {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    // The page behind the overlay must not scroll while it is open.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }

    // Close is the only control in here, so Tab simply stays on it.
    if (event.key === 'Tab') {
      event.preventDefault()
      closeRef.current?.focus()
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-slate-950/90 p-4 sm:p-8"
    >
      <div className="relative h-full w-full">
        <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
      </div>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-sm transition hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:bg-slate-900/90 dark:text-slate-100 dark:hover:bg-slate-900"
      >
        <CloseIcon className="size-5" />
      </button>
    </div>,
    document.body,
  )
}

/**
 * An image that fills its (positioned) parent and opens full screen when clicked.
 * The parent must be `relative` — the click target is an overlay covering it.
 */
export const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, sizes, priority }) => {
  const [zoomed, setZoomed] = useState(false)
  const close = useCallback(() => setZoomed(false), [])

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain"
        priority={priority}
      />

      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Enlarge image: ${alt}`}
        className="absolute inset-0 cursor-zoom-in rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset focus-visible:outline-none"
      />

      {zoomed && <Lightbox src={src} alt={alt} onClose={close} />}
    </>
  )
}

export default ZoomableImage
