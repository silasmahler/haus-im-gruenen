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
              <img
                src={photo.thumb}
                alt=""
                loading="lazy"
                width={720}
                height={Math.round((photo.height / photo.width) * 720)}
                className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={current.alt[locale]}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1)
          if (e.key === 'ArrowLeft') go(-1)
        }}
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/95"
      >
        {/* Clicking the dark backdrop around the photo closes the lightbox */}
        <div
          className="flex h-full flex-col items-center justify-center gap-3 p-4"
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        >
          <img
            src={current.src}
            alt={current.alt[locale]}
            className="max-h-[80dvh] max-w-full rounded-md object-contain"
          />
          <p className="text-center text-sm text-cream">
            {current.alt[locale]} <span className="text-sage">· {s.gallery.counter(index + 1, photos.length)}</span>
          </p>
          <div className="flex gap-2">
            <LightboxButton label={s.gallery.prev} onClick={() => go(-1)}>
              <ChevronLeft className="size-5" />
            </LightboxButton>
            <LightboxButton label={s.gallery.close} onClick={() => dialog.current?.close()}>
              <X className="size-5" />
            </LightboxButton>
            <LightboxButton label={s.gallery.next} onClick={() => go(1)}>
              <ChevronRight className="size-5" />
            </LightboxButton>
          </div>
        </div>
      </dialog>
    </>
  )
}

function LightboxButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-full bg-paper/10 p-3 text-cream hover:bg-paper/20 focus-visible:outline-2 focus-visible:outline-cream"
    >
      {children}
    </button>
  )
}
