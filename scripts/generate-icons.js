const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');

const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateIcons() {
  console.log('Generating PWA icons from SVG...\n');

  // Check if SVG exists
  if (!fs.existsSync(SVG_PATH)) {
    console.error('Error: icon.svg not found at', SVG_PATH);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const { size, name } of sizes) {
    const outputPath = path.join(ICONS_DIR, name);

    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message);
    }
  }

  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons();
