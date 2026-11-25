import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

// /gaestemappe (noindex) and the legal pages stay out; the legal pages remain indexable
const ROUTES: [string, number][] = [
  ['', 1],
  ['/ferienhaus', 0.9],
  ['/urlaub', 0.7],
  ['/firmenkunden', 0.9],
  ['/preise', 0.6],
  ['/umgebung', 0.6],
  ['/kontakt', 0.6],
  ['/hausregeln', 0.4],
  ['/buchungsbedingungen', 0.3],
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map(([r, priority]) => ({ url: `${SITE_URL}${r}`, lastModified, changeFrequency: 'monthly', priority }))
}
