const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// The Zen Swirl SVG
const svgContent = `
<svg width="256" height="256" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Tear/Comma shape -->
    <path id="petal" d="M 50 40 C 55 20, 75 15, 80 30 C 85 45, 60 50, 50 40 Z" fill="none" stroke="#ffffff" stroke-width="2" />
  </defs>
  
  <g transform="translate(50, 50) scale(0.8)">
    <use href="#petal" transform="translate(-50, -50) rotate(0 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(45 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(90 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(135 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(180 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(225 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(270 50 50)" />
    <use href="#petal" transform="translate(-50, -50) rotate(315 50 50)" />
  </g>
</svg>
`;

async function createIcons() {
  const svgBuffer = Buffer.from(svgContent);

  // App Icon (256x256 PNG - electron-builder will auto-convert to ICO for Windows)
  await sharp(svgBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
    
  console.log('icon.png created.');

  // Tray Icon (32x32 PNG)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(assetsDir, 'tray-icon.png'));
    
  console.log('tray-icon.png created.');
}

createIcons().catch(console.error);
