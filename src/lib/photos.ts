// Web copies live in public/fotos/<id>.jpg (max 1440px) and public/fotos/thumb/<id>.jpg (max 720px).
// Originals: tour-refs/fotos/. To add one:
//   magick tour-refs/fotos/NN.jpg -resize '1440x1440>' -strip -sampling-factor 4:2:0 -interlace Plane -quality 72 public/fotos/NN.jpg
//   magick tour-refs/fotos/NN.jpg -resize '720x720>' -strip -sampling-factor 4:2:0 -interlace Plane -quality 68 public/fotos/thumb/NN.jpg
//   node scripts/optimize-images.mjs   (WebP copies next to both JPEGs)
// then add an entry below.

export type PhotoCategory = 'garten' | 'wohnen' | 'kueche' | 'schlafen' | 'bad' | 'arbeiten' | 'kinder'

export interface Photo {
  id: string
  src: string
  thumb: string
  webp: string
  thumbWebp: string
  width: number
  height: number
  alt: { de: string; en: string }
  category: PhotoCategory
}

function p(id: string, category: PhotoCategory, de: string, en: string, height = 1080): Photo {
  return {
    id,
    src: `/fotos/${id}.jpg`,
    thumb: `/fotos/thumb/${id}.jpg`,
    webp: `/fotos/${id}.webp`,
    thumbWebp: `/fotos/thumb/${id}.webp`,
    width: 1440,
    height,
    alt: { de, en },
    category,
  }
}

export const PHOTOS: Photo[] = [
  p('36', 'garten', 'Gedeckter Tisch auf der Terrasse mit Weingläsern und Kerzen', 'Table set on the terrace with wine glasses and candles'),
  p('06', 'garten', 'Großer Garten mit Sitzgruppe vor dem Haus', 'Large garden with seating in front of the house'),
  // Hero on / (owner to confirm it is the intended intro photo)
  p('01', 'garten', 'Gartensitzgruppe mit grünen Kissen, Wein und Blumen', 'Garden lounge with green cushions, wine and flowers'),
  p('03', 'garten', 'Sonnige Gartenwiese mit Sitzecke und Blick ins Grüne', 'Sunny lawn with a seating corner and a view of the countryside'),
  p('35', 'garten', 'Rückseite des Backsteinhauses mit Rasen in der Sonne', 'Back of the brick house with lawn in the sun', 957),
  p('38', 'garten', 'Zwei Sonnenliegen auf der geschützten Terrasse', 'Two sun loungers on the sheltered terrace', 960),
  p('37', 'garten', 'Gartenbank im Schatten der Hecke', 'Garden bench in the shade of the hedge', 960),
  p('39', 'garten', 'Garten mit blühendem Flieder und Weidenzaun', 'Garden with lilac in bloom and a willow fence', 1044),
  p('43', 'garten', 'Holzkohlegrill an der Hauswand', 'Charcoal barbecue by the house wall'),
  p('46', 'garten', 'Hof mit Doppelcarport und Parkfläche', 'Courtyard with double carport and parking', 960),
  p('05', 'wohnen', 'Wohnbereich mit Sofa, Sesseln und Smart-TV', 'Living area with sofa, armchairs and smart TV'),
  p('09', 'wohnen', 'Heller Wohnbereich mit Holzboden', 'Bright living area with wooden floor'),
  p('11', 'wohnen', 'Wohnzimmer mit großer Eckcouch', 'Living room with a large corner sofa', 960),
  p('12', 'wohnen', 'Sofaecke mit Blick durch die Terrassentür in den Garten', 'Sofa corner with a view through the terrace door into the garden'),
  p('10', 'wohnen', 'Kaminofen mit Sitzbank', 'Wood-burning stove with a bench', 960),
  p('19', 'kueche', 'Küche mit großem Esstisch', 'Kitchen with a large dining table', 1093),
  p('04', 'kueche', 'Küche und Essplatz mit viel Tageslicht', 'Kitchen and dining area with plenty of daylight'),
  p('16', 'kueche', 'Küchenzeile mit Cerankochfeld, Backofen und Geschirrspüler', 'Kitchen with ceramic hob, oven and dishwasher'),
  p('15', 'kueche', 'Kaffeeecke mit Kaffeemaschine und Teekanne', 'Coffee corner with coffee machine and teapot', 960),
  p('14', 'kueche', 'Spüle am Fenster mit Blick ins Grüne', 'Sink by the window overlooking the countryside'),
  p('02', 'schlafen', 'Schlafzimmer mit Doppelbett', 'Bedroom with double bed'),
  p('20', 'schlafen', 'Schlafzimmer mit Doppelbett und Gartentür', 'Bedroom with double bed and garden door', 1103),
  p('21', 'schlafen', 'Doppelbett mit grüner Tagesdecke', 'Double bed with a green bedspread', 960),
  p('26', 'schlafen', 'Zimmer mit ausziehbarem Bett, gut abzudunkeln', 'Room with pull-out bed that can be fully darkened'),
  p('24', 'schlafen', 'Zimmer mit Einzelbett zum Ausziehen und Schreibtisch', 'Room with pull-out single bed and desk'),
  p('25', 'schlafen', 'Gästezimmer mit Bett und Schreibtisch am Fenster', 'Guest room with bed and desk by the window'),
  p('33', 'arbeiten', 'Arbeitsplatz mit Laptop am Fenster', 'Workspace with laptop by the window'),
  p('23', 'arbeiten', 'Schreibtisch mit Lampe im Schlafzimmer', 'Desk with lamp in the bedroom'),
  p('30', 'bad', 'Badezimmer mit Dusche und Badewanne', 'Bathroom with shower and bathtub', 1114),
  p('29', 'bad', 'Badezimmer mit Fenster', 'Bathroom with window', 960),
  p('32', 'bad', 'Gäste-WC', 'Guest toilet'),
  p('42', 'kinder', 'Kinderreisebett mit Matratze', 'Travel cot with mattress', 960),
  p('45', 'kinder', 'Kinderhochstuhl', 'Child’s high chair', 1878),
  p('41', 'kinder', 'Kindertisch mit Spielen', 'Children’s table with games', 960),
]

export function photo(id: string): Photo {
  const found = PHOTOS.find((x) => x.id === id)
  if (!found) throw new Error(`Unknown photo ${id}`)
  return found
}
