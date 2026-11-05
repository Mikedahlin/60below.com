import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import opentype from 'three/addons/libs/opentype.module.js';

const fontBytes = await fs.readFile('public/assets/fonts/NBArchitektStd-Bold-export/NBArchitektStd-Bold.otf');
const font = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));
const p = font.getPath('-60', 20, 140, 140);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" style="background:black">
  <path d="${p.toPathData()}" fill="white" />
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('scripts/test-normal.png');
console.log('Saved scripts/test-normal.png');

