import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    // /gaestemappe is not disallowed on purpose: crawlers must be able to read its noindex tag
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://haus-im-gruenen.com/sitemap.xml',
  }
}
