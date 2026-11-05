import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#0a1c2a"/>
      <stop offset="60%" stop-color="#03070b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#a6f7ff"/>
      <stop offset="70%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0099cc"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="50%" stop-color="#006699"/>
      <stop offset="100%" stop-color="#00f5ff"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- High-contrast Squircle Base -->
  <rect x="12" y="12" width="488" height="488" rx="112" ry="112" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="16"/>

  <!-- Primary Minus 60 Degree Brand Mark -->
  <g filter="url(#glow)" text-anchor="middle">
    <text x="256" y="278" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="205" fill="url(#cyanGrad)" letter-spacing="-8">-60°</text>
  </g>

  <!-- Standout Badge Pill: 60BELOW.COM -->
  <g transform="translate(46, 345)">
    <rect x="0" y="0" width="420" height="84" rx="42" ry="42" fill="#001827" stroke="#00f5ff" stroke-width="7"/>
    <text x="210" y="56" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="42" fill="#ffffff" letter-spacing="4">60BELOW.COM</text>
  </g>
</svg>`;

async function run() {
  const metaDir = path.join(publicDir, 'assets/meta');
  await fs.mkdir(metaDir, { recursive: true });

  const svgBuffer = Buffer.from(svg);
  await fs.writeFile(path.join(publicDir, 'favicon.svg'), svgBuffer);
  await fs.writeFile(path.join(metaDir, 'safari-pinned-tab.svg'), svgBuffer);

  const sizes = [16, 32, 48, 64, 180, 512];
  for (const size of sizes) {
    const png = await sharp(svgBuffer).resize(size, size).png().toBuffer();
    if (size === 16) await fs.writeFile(path.join(metaDir, 'favicon-16x16.png'), png);
    if (size === 32) await fs.writeFile(path.join(metaDir, 'favicon-32x32.png'), png);
    if (size === 180) await fs.writeFile(path.join(metaDir, 'apple-touch-icon.png'), png);
    if (size === 512) {
      await fs.writeFile(path.join(publicDir, 'favicon-512x512.png'), png);
      await fs.writeFile(path.join(publicDir, 'icon.png'), png);
      await fs.writeFile(path.join(root, 'test-favicon.png'), png);
    }
  }

  // Generate ICO containing 16x16, 32x32, 48x48
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

  // ICO header + 3 directory entries + image data
  function buildIco(images) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type 1 = ICO
    header.writeUInt16LE(images.length, 4); // number of images

    let offset = 6 + images.length * 16;
    const entries = [];
    for (const img of images) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
      entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel
      entry.writeUInt32LE(img.buffer.length, 8); // image size
      entry.writeUInt32LE(offset, 12); // image offset
      entries.push(entry);
      offset += img.buffer.length;
    }
    return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
  }

  const icoBuffer = buildIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ]);
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Favicons generated successfully.');
}

run();

