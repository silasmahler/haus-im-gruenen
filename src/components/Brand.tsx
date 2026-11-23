// Brand assets for the website. Source of truth for the mark: public/brand/logo-a-mark.svg ("Blattgiebel").

export function BrandMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path d="M12.5 23 H35.5 V44 H12.5 Z" fill="var(--color-wood)" />
      <path d="M16.5 44 V36 a3 3 0 0 1 6 0 V44 Z" fill="var(--color-paper)" />
      <rect x="26.5" y="29" width="5.5" height="5.5" rx="0.6" fill="var(--color-paper)" />
      <path d="M3 26.5 C10.5 23.3 17 22.2 24 22.2 C31 22.2 37.5 23.3 45 26.5" stroke="var(--color-paper)" strokeWidth="3.2" fill="none" />
      <path
        d="M3 26.5 C8 16 15 8.5 24.5 4 C33 8.5 39.5 16 45 26.5 C37.5 23.3 31 22.2 24 22.2 C17 22.2 10.5 23.3 3 26.5 Z"
        fill="var(--color-moss)"
      />
      <path
        d="M24.3 7 C23.6 12 23.7 16.5 24 21 M23.9 18.4 L17.5 14.6 M23.9 18.4 L30.5 14.6 M23.8 13 L19.6 10.6 M23.8 13 L28.2 10.6"
        stroke="var(--color-paper)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path className="brand-stalk" d="M24.5 4.2 C25 2 26.8 0.9 29 1.4" stroke="var(--color-moss)" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
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
      <BrandMark className="size-8 shrink-0" />
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
