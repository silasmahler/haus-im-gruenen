/* eslint-disable @next/next/no-img-element */
// Brand assets for the website, supplied by the owner (originals in docs/brand-besitzer/).
// Optimised WebP renditions live in public/brand/besitzer/.
const BRAND = '/brand/besitzer'

// Picture mark (Logo.png). Size it via height, e.g. "h-10"; width follows the 1.345:1 aspect ratio.
export function BrandMark({ className = 'h-9' }: { className?: string }) {
  return (
    <img
      src={`${BRAND}/logo-96.webp`}
      srcSet={`${BRAND}/logo-48.webp 65w, ${BRAND}/logo-96.webp 129w, ${BRAND}/logo-144.webp 194w`}
      sizes="65px"
      width={129}
      height={96}
      alt=""
      aria-hidden
      decoding="async"
      className={`w-auto shrink-0 ${className}`}
    />
  )
}

// Mark with lettering (Logo-mit-Schriftzug.png), 2.36:1.
export function BrandLockup({ alt = 'Haus im Grünen', className = 'w-60' }: { alt?: string; className?: string }) {
  return (
    <img
      src={`${BRAND}/logo-schriftzug-480.webp`}
      srcSet={`${BRAND}/logo-schriftzug-240.webp 240w, ${BRAND}/logo-schriftzug-480.webp 480w, ${BRAND}/logo-schriftzug-720.webp 720w`}
      sizes="240px"
      width={480}
      height={203}
      alt={alt}
      decoding="async"
      className={`h-auto ${className}`}
    />
  )
}

// Framed sign "Haus im Grünen – Ferienhaus • Rendswühren" (Banner.png), 5.5:1.
export function BrandBanner({ alt, className = '' }: { alt: string; className?: string }) {
  return (
    <img
      src={`${BRAND}/banner-1280.webp`}
      srcSet={`${BRAND}/banner-640.webp 640w, ${BRAND}/banner-1280.webp 1280w, ${BRAND}/banner-1920.webp 1920w`}
      sizes="(min-width: 672px) 640px, 100vw"
      width={1280}
      height={233}
      alt={alt}
      decoding="async"
      className={`h-auto w-full ${className}`}
    />
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display brand-wordmark ${className}`}>
      Haus <em className="font-normal text-moss">im</em> Grünen
    </span>
  )
}

// Hand-drawn field edge: a ploughed line, a hedge and the little house in the middle.
export function HedgeDivider({ className = '', width = 'max-w-6xl' }: { className?: string; width?: string }) {
  return (
    <div className={`mx-auto flex ${width} items-end gap-3 px-4 text-sage sm:px-6 ${className}`} aria-hidden>
      <svg viewBox="0 0 400 22" preserveAspectRatio="xMaxYMax slice" className="h-6 min-w-0 flex-1">
        <path d="M0 19 C60 17 120 20 180 18 S300 17 400 19" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path
          d="M296 18.5 c2-9 10-10 13-3 c2-8 11-9 13-1 c3-7 10-7 12 1 c2-6 9-6 11 1 c3-8 12-8 13 1 c2-5 8-5 10 1 c2-7 10-7 11 0"
          stroke="var(--color-moss)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <BrandMark className="h-8" />
      <svg viewBox="0 0 400 22" preserveAspectRatio="xMinYMax slice" className="h-6 min-w-0 flex-1">
        <path d="M0 19 C100 21 160 17 220 18.5 S340 20 400 18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M60 18.5 V13" stroke="var(--color-wood)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="60" cy="10" r="5" fill="var(--color-sage-light)" stroke="var(--color-moss)" strokeWidth="1.5" />
        <path d="M76 18.5 V15 M76 15 c-2.6 0-3.4-3.6 0-4.4 c3.4 .8 2.6 4.4 0 4.4" stroke="var(--color-moss)" strokeWidth="1.3" fill="none" />
      </svg>
    </div>
  )
}

// Handwritten accent with a pencil underline.
export function HandNote({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block font-hand text-wood ${className}`}>
      {children}
      <svg viewBox="0 0 200 10" preserveAspectRatio="none" className="absolute -bottom-1.5 left-0 h-2.5 w-full" aria-hidden>
        <path d="M3 7 C40 3 90 4 130 5 S180 6 197 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  )
}
