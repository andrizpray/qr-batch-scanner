import { writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Minimal valid 1x1 gray PNG (base64)
// This is a proper PNG file with correct headers and CRC
const minimalPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Icons to generate: [filename, width, height]
const icons = [
  { name: 'pwa-192x192.png', width: 192, height: 192 },
  { name: 'pwa-512x512.png', width: 512, height: 512 },
];

for (const icon of icons) {
  const filePath = join(publicDir, icon.name);
  // Decode base64 and write as binary PNG
  const pngBuffer = Buffer.from(minimalPngBase64, 'base64');
  writeFileSync(filePath, pngBuffer);
  console.log(`Generated: ${icon.name}`);
}

// apple-touch-icon.png — copy of pwa-192x192
const src = join(publicDir, 'pwa-192x192.png');
const dst = join(publicDir, 'apple-touch-icon.png');
copyFileSync(src, dst);
console.log('Generated: apple-touch-icon.png (copied from pwa-192x192.png)');

console.log('\nAll PWA icons generated successfully.');
