import { deflateSync, inflateSync } from 'node:zlib';

export const WIDTH = 400;
export const HEIGHT = 300;
export const ROW_BYTES = WIDTH / 8;
export const FRAME_BYTES = ROW_BYTES * HEIGHT;

const SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let crc = n;
  for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  return crc >>> 0;
});
const REVERSE = Uint8Array.from({ length: 256 }, (_, value) => {
  let reversed = 0;
  for (let bit = 0; bit < 8; bit++) reversed = (reversed << 1) | ((value >>> bit) & 1);
  return reversed;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const value of data) crc = CRC_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const contents = Buffer.concat([name, data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(contents));
  return Buffer.concat([size, contents, checksum]);
}

function options({ whiteIsOne = true, msbFirst = true } = {}) {
  if (typeof whiteIsOne !== 'boolean' || typeof msbFirst !== 'boolean') {
    throw new TypeError('whiteIsOne and msbFirst must be booleans');
  }
  return { whiteIsOne, msbFirst };
}

function paeth(a, b, c) {
  const predictor = a + b - c;
  const da = Math.abs(predictor - a);
  const db = Math.abs(predictor - b);
  const dc = Math.abs(predictor - c);
  return da <= db && da <= dc ? a : db <= dc ? b : c;
}

function readOneBitPng(pngBuffer) {
  if (!Buffer.isBuffer(pngBuffer) || !pngBuffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new TypeError('input must be a PNG Buffer');
  }
  let offset = 8;
  let header;
  let ended = false;
  const compressed = [];
  while (offset + 12 <= pngBuffer.length) {
    const length = pngBuffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > pngBuffer.length) throw new Error('truncated PNG chunk');
    const name = pngBuffer.toString('ascii', offset + 4, offset + 8);
    const data = pngBuffer.subarray(offset + 8, offset + 8 + length);
    const recordedCrc = pngBuffer.readUInt32BE(end - 4);
    if (crc32(pngBuffer.subarray(offset + 4, end - 4)) !== recordedCrc) {
      throw new Error(`invalid PNG CRC in ${name}`);
    }
    if (!header && name !== 'IHDR') throw new Error('PNG must begin with IHDR');
    if (name === 'IHDR') {
      if (header || length !== 13) throw new Error('invalid PNG IHDR');
      header = data;
    } else if (name === 'IDAT') {
      compressed.push(data);
    } else if (name === 'IEND') {
      ended = true;
      if (length !== 0 || end !== pngBuffer.length) throw new Error('invalid PNG end');
      break;
    } else if ((name.charCodeAt(0) & 32) === 0) {
      throw new Error(`unsupported PNG chunk ${name}`);
    }
    offset = end;
  }
  if (!ended || !header || compressed.length === 0) throw new Error('incomplete PNG');
  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  if (width !== WIDTH || height !== HEIGHT) throw new Error(`PNG must be ${WIDTH}x${HEIGHT}, got ${width}x${height}`);
  if (header[8] !== 1 || header[9] !== 0 || header[10] !== 0 || header[11] !== 0 || header[12] !== 0) {
    throw new Error('PNG must be non-interlaced 1-bit grayscale');
  }
  const scanlines = inflateSync(Buffer.concat(compressed), { maxOutputLength: HEIGHT * (ROW_BYTES + 1) + 1 });
  if (scanlines.length !== HEIGHT * (ROW_BYTES + 1)) throw new Error('invalid PNG scanline length');
  const pixels = Buffer.alloc(FRAME_BYTES);
  for (let row = 0; row < HEIGHT; row++) {
    const filter = scanlines[row * (ROW_BYTES + 1)];
    if (filter > 4) throw new Error(`unsupported PNG filter ${filter}`);
    for (let col = 0; col < ROW_BYTES; col++) {
      const target = row * ROW_BYTES + col;
      const raw = scanlines[row * (ROW_BYTES + 1) + col + 1];
      const left = col ? pixels[target - 1] : 0;
      const above = row ? pixels[target - ROW_BYTES] : 0;
      const upperLeft = row && col ? pixels[target - ROW_BYTES - 1] : 0;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][filter];
      pixels[target] = (raw + predictor) & 0xff;
    }
  }
  return pixels;
}

function writeOneBitPng(pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(WIDTH, 0);
  header.writeUInt32BE(HEIGHT, 4);
  header[8] = 1; // grayscale, one bit per pixel
  const scanlines = Buffer.alloc(HEIGHT * (ROW_BYTES + 1));
  for (let row = 0; row < HEIGHT; row++) {
    pixels.copy(scanlines, row * (ROW_BYTES + 1) + 1, row * ROW_BYTES, (row + 1) * ROW_BYTES);
  }
  return Buffer.concat([
    SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(scanlines)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

export function pngToFramebuffer(pngBuffer, flags) {
  const { whiteIsOne, msbFirst } = options(flags);
  const pixels = readOneBitPng(pngBuffer);
  for (let i = 0; i < pixels.length; i++) {
    let value = pixels[i];
    if (!whiteIsOne) value ^= 0xff;
    pixels[i] = msbFirst ? value : REVERSE[value];
  }
  return pixels;
}

export function framebufferToPng(framebuffer, flags) {
  const { whiteIsOne, msbFirst } = options(flags);
  if (!Buffer.isBuffer(framebuffer) || framebuffer.length !== FRAME_BYTES) {
    throw new Error(`raw framebuffer must be exactly ${FRAME_BYTES} bytes`);
  }
  const pixels = Buffer.alloc(FRAME_BYTES);
  for (let i = 0; i < FRAME_BYTES; i++) {
    let value = msbFirst ? framebuffer[i] : REVERSE[framebuffer[i]];
    if (!whiteIsOne) value ^= 0xff;
    pixels[i] = value;
  }
  return writeOneBitPng(pixels);
}
