// Gera os ícones PWA (PNG) a partir de um desenho simples da marca, sem
// dependências externas — encoder PNG mínimo (RGBA, sem filtro) + zlib.
// Uso: node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public')

const BG = [17, 24, 39, 255] // #111827
const ACCENT = [249, 115, 22, 255] // #f97316
const WHITE = [255, 255, 255, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  // 10,11,12 = compression/filter/interlace = 0
  const raw = Buffer.alloc(size * (size * 4 + 1))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const p = pixels[y * size + x]
      raw[o++] = p[0]
      raw[o++] = p[1]
      raw[o++] = p[2]
      raw[o++] = p[3]
    }
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Desenha dois "cards" rotacionados sobre fundo arredondado.
function draw(size) {
  const px = new Array(size * size).fill(BG)
  const r = size * 0.22 // raio do canto do fundo

  const inCorner = (x, y) => {
    const c = [
      [r, r],
      [size - r, r],
      [r, size - r],
      [size - r, size - r],
    ]
    if (x < r && y < r) return Math.hypot(x - c[0][0], y - c[0][1]) > r
    if (x > size - r && y < r) return Math.hypot(x - c[1][0], y - c[1][1]) > r
    if (x < r && y > size - r) return Math.hypot(x - c[2][0], y - c[2][1]) > r
    if (x > size - r && y > size - r) return Math.hypot(x - c[3][0], y - c[3][1]) > r
    return false
  }

  const card = (cx, cy, w, h, angleDeg, color) => {
    const a = (angleDeg * Math.PI) / 180
    const cos = Math.cos(-a)
    const sin = Math.sin(-a)
    return (x, y) => {
      const dx = x - cx
      const dy = y - cy
      const lx = dx * cos - dy * sin
      const ly = dx * sin + dy * cos
      if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2) return color
      return null
    }
  }

  const c1 = card(size * 0.44, size * 0.41, size * 0.3, size * 0.38, -8, ACCENT)
  const c2 = card(size * 0.57, size * 0.59, size * 0.3, size * 0.38, 7, WHITE)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inCorner(x, y)) {
        px[y * size + x] = [0, 0, 0, 0]
        continue
      }
      const top = c2(x, y) ?? c1(x, y)
      if (top) px[y * size + x] = top
    }
  }
  return px
}

mkdirSync(outDir, { recursive: true })
for (const size of [192, 512]) {
  const png = encodePng(size, draw(size))
  const file = join(outDir, `pwa-${size}.png`)
  writeFileSync(file, png)
  console.log(`wrote ${file} (${png.length} bytes)`)
}
