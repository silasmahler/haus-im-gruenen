// Creates WebP copies next to the JPEG web copies in public/fotos and public/fotos/thumb.
// Run after adding photos: node scripts/optimize-images.mjs
import { readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const dirs = [
  ['public/fotos', 72],
  ['public/fotos/thumb', 68],
]

for (const [dir, quality] of dirs) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.jpg'))) {
    const src = join(dir, file)
    const out = src.replace(/\.jpg$/, '.webp')
    if (existsSync(out) && statSync(out).mtimeMs > statSync(src).mtimeMs) continue
    await sharp(src).webp({ quality }).toFile(out)
    console.log('wrote', out)
  }
}
