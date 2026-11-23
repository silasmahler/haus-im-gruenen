import type { Photo } from '@/lib/photos'

// WebP with JPEG fallback; the browser picks the 720px or 1440px copy via srcset/sizes.
export function Picture({
  photo,
  alt,
  sizes = '100vw',
  className = '',
  priority = false,
}: {
  photo: Photo
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
}) {
  return (
    <picture>
      <source type="image/webp" srcSet={`${photo.thumbWebp} 720w, ${photo.webp} 1440w`} sizes={sizes} />
      <img
        src={photo.thumb}
        srcSet={`${photo.thumb} 720w, ${photo.src} 1440w`}
        sizes={sizes}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  )
}
