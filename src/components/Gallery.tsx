'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { useLanguage } from '@/i18n/LanguageContext'
import { useSite } from '@/i18n/site'
import type { Photo } from '@/lib/photos'

// Thumbnail grid + lightbox on a native <dialog> (Esc closes natively, arrow keys navigate).
export function Gallery({ photos }: { photos: Photo[] }) {
  const { locale } = useLanguage()
  const s = useSite()
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  const current = photos[index]
  const go = (step: number) => setIndex((i) => (i + step + photos.length) % photos.length)

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => {
                setIndex(i)
                dialog.current?.showModal()
              }}
              aria-label={`${s.gallery.open}: ${photo.alt[locale]}`}
              className="block aspect-[4/3] w-full overflow-hidden rounded-md bg-cream-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-moss"
            >
              <picture>
                {photo.thumbWebp && <source type="image/webp" srcSet={photo.thumbWebp} />}
                <img
                  src={photo.thumb}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={720}
                  height={Math.round((photo.height / photo.width) * 720)}
                  className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-[1.03]"
                />
              </picture>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-labelledby="lightbox-caption"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/95"
      >
        {/* Clicking the dark backdrop around the photo closes the lightbox */}
        <div
          className="relative flex h-full flex-col items-center justify-center gap-3 p-4"
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        >
          <div className="absolute top-4 right-4">
            {/* autoFocus: the native dialog moves focus here when opened */}
            <LightboxButton label={s.gallery.close} onClick={() => dialog.current?.close()} autoFocus>
              <X className="size-5" />
            </LightboxButton>
          </div>
          <picture>
            {current.webp && <source type="image/webp" srcSet={current.webp} />}
            <img
              src={current.src}
              alt={current.alt[locale]}
              className="max-h-[78dvh] max-w-full rounded-md object-contain"
            />
          </picture>
          <p id="lightbox-caption" aria-live="polite" className="text-center text-sm text-cream">
            {current.alt[locale]} <span className="text-sage">· {s.gallery.counter(index + 1, photos.length)}</span>
          </p>
          <div className="flex items-center gap-2">
            <LightboxButton label={s.gallery.prev} onClick={() => go(-1)}>
              <ChevronLeft className="size-5" />
            </LightboxButton>
            <LightboxButton label={s.gallery.next} onClick={() => go(1)}>
              <ChevronRight className="size-5" />
            </LightboxButton>
          </div>
          <p className="hidden text-xs text-sage sm:block">{s.gallery.keys}</p>
        </div>
      </dialog>
    </>
  )
}

function LightboxButton({
  label,
  onClick,
  autoFocus,
  children,
}: {
  label: string
  onClick: () => void
  autoFocus?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      aria-label={label}
      className="rounded-full bg-paper/10 p-3 text-cream hover:bg-paper/20 focus-visible:outline-2 focus-visible:outline-cream"
    >
      {children}
    </button>
  )
}
