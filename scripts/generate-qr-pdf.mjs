// Generates printable A4 PDFs with cut marks for a 10x20cm stand insert (welcome + QR code),
// one for the front (German) and one for the back (English).
// Run with: npm run generate:qr-pdf
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://haus-im-gruenen.com'
const OUT_DIR = path.join(__dirname, '..', 'public')

const BRAND_DARK = '#164e3d'
const BRAND_TEXT = '#333333'
const BRAND_SOFT = '#666666'

// 1 cm = 28.3465 pt
const CM = 28.3465

// Stand insert is 10 x 20 cm. Printed a touch smaller so it still fits after
// cutting, even if the scissors aren't perfectly on the line.
const CARD_WIDTH = 9.7 * CM
const CARD_HEIGHT = 19.7 * CM

const LANGUAGES = [
  {
    file: 'willkommen-qr-code.pdf',
    cutLabel: 'Zuschnitt: 9,7 x 19,7 cm (Aufsteller: 10 x 20 cm)',
    line1: 'Willkommen im',
    line2: 'Haus im Grünen',
    intro: 'Wir wünschen dir einen schönen Aufenthalt!',
    body: 'Alle Infos zu WLAN, Hausregeln, Ausflugszielen und Restaurants findest du auf unserer Webseite:',
    scanHint: 'Einfach mit der Handykamera scannen',
  },
  {
    file: 'willkommen-qr-code-en.pdf',
    cutLabel: 'Cut size: 9.7 x 19.7 cm (stand: 10 x 20 cm)',
    line1: 'Welcome to',
    line2: 'Haus im Grünen',
    intro: 'We wish you a wonderful stay!',
    body: 'All info on WiFi, house rules, day trips and restaurants can be found on our website:',
    scanHint: 'Just scan with your phone camera',
  },
]

async function generateCard(lang, qrPngBuffer) {
  const outFile = path.join(OUT_DIR, lang.file)
  const doc = new PDFDocument({ size: 'A4', margin: 0 })
  const stream = doc.pipe(createWriteStream(outFile))

  const pageWidth = doc.page.width
  const pageHeight = doc.page.height

  const cardX = (pageWidth - CARD_WIDTH) / 2
  const cardY = (pageHeight - CARD_HEIGHT) / 2

  // Cut marks (short crosses at each corner of the 10x20cm card)
  const markLen = 12
  const corners = [
    [cardX, cardY],
    [cardX + CARD_WIDTH, cardY],
    [cardX, cardY + CARD_HEIGHT],
    [cardX + CARD_WIDTH, cardY + CARD_HEIGHT],
  ]
  doc.lineWidth(0.75).strokeColor('#999999')
  for (const [cx, cy] of corners) {
    doc
      .moveTo(cx - markLen, cy)
      .lineTo(cx + markLen, cy)
      .stroke()
      .moveTo(cx, cy - markLen)
      .lineTo(cx, cy + markLen)
      .stroke()
  }

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#999999')
    .text(lang.cutLabel, 0, cardY + CARD_HEIGHT + 16, {
      width: pageWidth,
      align: 'center',
    })

  const contentX = cardX + 14
  const contentWidth = CARD_WIDTH - 28
  const centerX = cardX + CARD_WIDTH / 2

  // Outer frame around the card content
  doc
    .rect(cardX + 8, cardY + 8, CARD_WIDTH - 16, CARD_HEIGHT - 16)
    .lineWidth(1.2)
    .strokeColor(BRAND_DARK)
    .stroke()

  doc
    .rect(cardX + 14, cardY + 14, CARD_WIDTH - 28, CARD_HEIGHT - 28)
    .lineWidth(0.5)
    .strokeColor('#a8c9bd')
    .stroke()

  let y = cardY + 46

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(BRAND_DARK)
    .text(lang.line1, contentX, y, { width: contentWidth, align: 'center' })

  y = doc.y + 2
  doc
    .fontSize(24)
    .text(lang.line2, contentX, y, { width: contentWidth, align: 'center' })

  // Decorative separator line under the title
  y = doc.y + 14
  const lineWidth = 80
  doc
    .moveTo(centerX - lineWidth / 2, y)
    .lineTo(centerX + lineWidth / 2, y)
    .lineWidth(1)
    .strokeColor(BRAND_DARK)
    .stroke()

  y += 20
  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(BRAND_TEXT)
    .text(lang.intro, contentX, y, {
      width: contentWidth,
      align: 'center',
    })

  y = doc.y + 10
  doc.fontSize(11).text(lang.body, contentX, y, { width: contentWidth, align: 'center' })

  const qrSize = 170
  const qrY = doc.y + 22
  doc.image(qrPngBuffer, centerX - qrSize / 2, qrY, { width: qrSize, height: qrSize })

  y = qrY + qrSize + 16
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(BRAND_DARK)
    .text(SITE_URL.replace('https://', ''), contentX, y, {
      width: contentWidth,
      align: 'center',
    })

  y = doc.y + 8
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND_SOFT)
    .text(lang.scanHint, contentX, y, {
      width: contentWidth,
      align: 'center',
    })

  doc.end()

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve)
    stream.on('error', reject)
  })

  console.log(`PDF geschrieben: ${outFile}`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const qrPngBuffer = await QRCode.toBuffer(SITE_URL, {
    type: 'png',
    width: 600,
    margin: 1,
    color: { dark: BRAND_DARK, light: '#ffffff' },
  })

  for (const lang of LANGUAGES) {
    await generateCard(lang, qrPngBuffer)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
