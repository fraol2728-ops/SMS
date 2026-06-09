import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = join(process.cwd(), "public", "icons");
mkdirSync(iconsDir, { recursive: true });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(data, size, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const rowOffset = y * (size * 4 + 1) + 1;
  const offset = rowOffset + x * 4;
  data[offset] = r;
  data[offset + 1] = g;
  data[offset + 2] = b;
  data[offset + 3] = a;
}

function fillRect(data, size, x, y, width, height, color) {
  const [r, g, b, a = 255] = color;
  for (let yy = Math.max(0, y); yy < Math.min(size, y + height); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(size, x + width); xx += 1) {
      setPixel(data, size, xx, yy, r, g, b, a);
    }
  }
}

function makeIcon(size) {
  const stride = size * 4 + 1;
  const data = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y += 1) {
    data[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const t = (x + y) / (size * 2);
      const r = Math.round(15 + (26 - 15) * t);
      const g = Math.round(31 + (58 - 31) * t);
      const b = Math.round(61 + (107 - 61) * t);
      setPixel(data, size, x, y, r, g, b);
    }
  }

  const circleX = size * 0.5;
  const circleY = size * 0.46;
  const radius = size * 0.33;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - circleX;
      const dy = y + 0.5 - circleY;
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(data, size, x, y, 26, 86, 219);
      }
    }
  }

  const letterX = Math.round(size * 0.33);
  const letterY = Math.round(size * 0.27);
  const stroke = Math.max(5, Math.round(size * 0.075));
  const letterWidth = Math.round(size * 0.35);
  const letterHeight = Math.round(size * 0.38);
  const white = [255, 255, 255, 255];
  fillRect(data, size, letterX, letterY, stroke, letterHeight, white);
  fillRect(data, size, letterX, letterY, letterWidth, stroke, white);
  fillRect(
    data,
    size,
    letterX,
    letterY + Math.round(letterHeight / 2) - Math.round(stroke / 2),
    Math.round(letterWidth * 0.82),
    stroke,
    white,
  );
  fillRect(
    data,
    size,
    letterX,
    letterY + letterHeight - stroke,
    letterWidth,
    stroke,
    white,
  );

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(data)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of sizes) {
  writeFileSync(join(iconsDir, `icon-${size}x${size}.png`), makeIcon(size));
  console.log(`✓ icon-${size}x${size}.png`);
}

console.log("Done!");
