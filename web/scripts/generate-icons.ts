#!/usr/bin/env tsx
/**
 * Generate placeholder PWA icons.
 *
 * These are PLACEHOLDERS: a simple geometric mark in the project palette, not
 * real artwork. They exist so that installability works and the manifest does
 * not 404. Replace them with proper artwork when it is available — see
 * docs/content-import.md.
 *
 * A minimal PNG encoder is used rather than a dependency, because pulling in an
 * image library to draw two squares would not be a good trade.
 *
 * Usage: npx tsx scripts/generate-icons.ts
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/* --- Minimal PNG encoder -------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([length, typeAndData, crc]);
}

/** Encode RGBA pixel data as a PNG. */
function encodePng(width: number, height: number, rgba: Buffer): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Each scanline is prefixed with a filter-type byte (0 = none).
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* --- The mark ------------------------------------------------------------- */

type Rgb = readonly [number, number, number];

const PARCHMENT: Rgb = [0xfd, 0xfb, 0xf7];
const GOLD: Rgb = [0xd4, 0xaf, 0x37];
const SAFFRON: Rgb = [0xc2, 0x41, 0x0c];
const INK: Rgb = [0x2d, 0x1f, 0x15];

/**
 * Draw a simple lotus-inspired mark: a parchment field, a gold ring, and four
 * saffron petals around an ink centre. Geometric only, since there is no font
 * rasteriser available to draw "ॐ".
 *
 * `maskable` icons must keep content inside a safe zone, because the platform
 * may crop to a circle. Everything is kept within the central 80%.
 */
function drawIcon(size: number): Buffer {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;

  const ringOuter = size * 0.40;
  const ringInner = size * 0.355;
  const petalRadius = size * 0.115;
  const petalOffset = size * 0.215;
  const centreRadius = size * 0.075;

  const petals: Array<readonly [number, number]> = [
    [cx, cy - petalOffset],
    [cx, cy + petalOffset],
    [cx - petalOffset, cy],
    [cx + petalOffset, cy],
  ];

  const put = (i: number, [r, g, b]: Rgb) => {
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
    rgba[i + 3] = 0xff;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Background fills the whole square so maskable cropping never reveals
      // transparency.
      put(i, PARCHMENT);

      if (dist <= ringOuter && dist >= ringInner) {
        put(i, GOLD);
        continue;
      }

      let inPetal = false;
      for (const [px, py] of petals) {
        if (Math.hypot(x - px, y - py) <= petalRadius) {
          inPetal = true;
          break;
        }
      }
      if (inPetal) {
        put(i, SAFFRON);
        continue;
      }

      if (dist <= centreRadius) {
        put(i, INK);
      }
    }
  }

  return encodePng(size, size, rgba);
}

/* --- Write --------------------------------------------------------------- */

const outDir = path.join(process.cwd(), "public", "images");
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const file = path.join(outDir, `icon-${size}.png`);
  writeFileSync(file, drawIcon(size));
  console.log(`wrote ${path.relative(process.cwd(), file)} (${size}x${size})`);
}

// Apple touch icon. iOS ignores the manifest and reads this instead.
const appleIcon = path.join(process.cwd(), "src", "app", "apple-icon.png");
writeFileSync(appleIcon, drawIcon(180));
console.log(`wrote ${path.relative(process.cwd(), appleIcon)} (180x180)`);
