export const SITE_URL = 'https://haus-im-gruenen.com'
export const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === '1'

// Only verified facts. PLZ, geo, phone and ratings are left out until the owner confirms them.
const address = {
  '@type': 'PostalAddress',
  addressLocality: 'Rendswühren',
  addressRegion: 'Schleswig-Holstein',
  addressCountry: 'DE',
}

const images = ['01', '09', '33'].map((n) => `${SITE_URL}/fotos/${n}.jpg`)

const amenities = ['Kaminofen', 'Glasfaserinternet', 'Großer Garten', 'Voll ausgestattete Küche'].map((name) => ({
  '@type': 'LocationFeatureSpecification',
  name,
  value: true,
}))

export const vacationRentalJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VacationRental',
  name: 'Haus im Grünen',
  description:
    'Ferienhaus mit großem Garten in Rendswühren bei Neumünster: drei Schlafzimmer, Kaminofen, voll ausgestattete Küche und Glasfaserinternet.',
  url: SITE_URL,
  image: images,
  address,
  containsPlace: { '@type': 'Accommodation', additionalType: 'EntirePlace', numberOfBedrooms: 3 },
  amenityFeature: amenities,
}

export const lodgingBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Haus im Grünen – Firmenunterkunft',
  description:
    'Ganzes Haus für bis zu fünf Gäste in Rendswühren bei Neumünster: drei separate Schlafzimmer, Glasfaserinternet, Küche, auch für mehrere Wochen oder Monate.',
  url: `${SITE_URL}/firmenkunden`,
  image: images,
  address,
  audience: { '@type': 'BusinessAudience', audienceType: 'Firmen und Langzeitgäste' },
  amenityFeature: amenities,
}
