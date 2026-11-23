import type { MetadataRoute } from 'next'

import { IS_PREVIEW, SITE_URL } from '@/lib/seo'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  if (IS_PREVIEW) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    // /gaestemappe is not disallowed on purpose: crawlers must be able to read its noindex tag
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
