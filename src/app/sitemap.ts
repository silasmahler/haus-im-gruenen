import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE = 'https://haus-im-gruenen.com'
// /gaestemappe is for booked guests only (noindex), so it stays out
const ROUTES = ['', '/ferienhaus', '/urlaub', '/firmen', '/preise', '/bewertungen', '/kontakt', '/impressum', '/datenschutz']

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({ url: `${BASE}${r}`, changeFrequency: 'monthly', priority: r === '' ? 1 : 0.7 }))
}
