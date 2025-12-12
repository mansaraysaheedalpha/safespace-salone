# PWA Icons

Generate PNG icons from the SVG file:

## Option 1: Online Converter
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set output size to 192x192, download as `icon-192.png`
4. Set output size to 512x512, download as `icon-512.png`

## Option 2: Using ImageMagick (command line)
```bash
convert -background none -resize 192x192 icon.svg icon-192.png
convert -background none -resize 512x512 icon.svg icon-512.png
```

## Option 3: Using Sharp (Node.js)
```javascript
const sharp = require('sharp');

sharp('icon.svg').resize(192, 192).png().toFile('icon-192.png');
sharp('icon.svg').resize(512, 512).png().toFile('icon-512.png');
```

## Required Files
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

These icons are used for:
- PWA installation
- Home screen icon
- App switcher
- Splash screen
