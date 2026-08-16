// scripts/generate-pwa-icons.cjs
// Generates frontend/public/icon-192.png and icon-512.png: an orange "N" mark
// on a dark background, matching manifest.json's theme_color (#FF8C00) and
// background_color (#0f172a). Uses a zero-dependency PNG encoder (zlib is
// built into Node) rather than the `canvas` package, which isn't installed
// and requires native build tools this environment doesn't have.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0x0f, 0x17, 0x2e]; // #0f172a
const FG = [0xff, 0x8c, 0x00]; // #FF8C00

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Distance from point (px,py) to segment (x1,y1)-(x2,y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const strokeWidth = size * 0.11;

  // Letter "N" as three strokes within a centered safe zone (maskable-safe: ~65% of canvas)
  const margin = size * 0.28;
  const top = margin, bottom = size - margin;
  const left = margin, right = size - margin;

  const strokes = [
    [left, top, left, bottom],       // left vertical bar
    [left, top, right, bottom],      // diagonal
    [right, top, right, bottom],     // right vertical bar
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let isForeground = false;
      for (const [x1, y1, x2, y2] of strokes) {
        if (distToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2) <= strokeWidth / 2) {
          isForeground = true;
          break;
        }
      }
      const idx = (y * size + x) * 4;
      const color = isForeground ? FG : BG;
      pixels[idx] = color[0];
      pixels[idx + 1] = color[1];
      pixels[idx + 2] = color[2];
      pixels[idx + 3] = 255;
    }
  }

  // Filter each scanline with filter-byte 0 (None), as required by PNG spec
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const idatData = zlib.deflateSync(raw);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public');
for (const size of [192, 512]) {
  const png = drawIcon(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
}
