import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceLogo = existsSync(join(root, "nouveau logo.png"))
  ? join(root, "nouveau logo.png")
  : join(root, "logo.png");

const buildDir = join(root, "build");
const resourcesDir = join(root, "electron", "resources");
const assetsDir = join(root, "src", "assets");

mkdirSync(buildDir, { recursive: true });
mkdirSync(resourcesDir, { recursive: true });
mkdirSync(assetsDir, { recursive: true });

async function processLogos() {
  const { data, info } = await sharp(sourceLogo)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Déterminer la couleur de fond via les 4 coins
  const corners = [
    (0 * width + 0) * channels,
    (0 * width + (width - 1)) * channels,
    ((height - 1) * width + 0) * channels,
    ((height - 1) * width + (width - 1)) * channels,
  ];
  const avgCornerLum =
    corners.reduce((sum, i) => sum + ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0)) / 3, 0) / 4;
  const isWhiteBg = avgCornerLum > 128;

  let minX = width, minY = height, maxX = 0, maxY = 0;
  let markMinX = width, markMaxX = 0, markMinY = height, markMaxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const lum = (r + g + b) / 3;

      if (isWhiteBg) {
        if (lum >= 235) {
          data[i + 3] = 0;
        } else if (lum > 30) {
          const alphaFactor = (255 - lum) / 225;
          data[i + 3] = Math.round(Math.min(255, Math.max(0, alphaFactor * 255)));
        } else {
          data[i + 3] = 255;
        }
      } else {
        if (lum <= 20) {
          data[i + 3] = 0;
        } else if (lum < 225) {
          const alphaFactor = (lum - 20) / 205;
          data[i + 3] = Math.round(Math.min(255, Math.max(0, alphaFactor * 255)));
        } else {
          data[i + 3] = 255;
        }
      }

      if ((data[i + 3] ?? 0) > 25) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;

        // Bounding box globale (Emblème + Texte "Serenity")
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;

        // Bounding box de l'emblème seul (situé sur la gauche avant le premier vide)
        if (x <= 440) {
          if (x < markMinX) markMinX = x;
          if (y < markMinY) markMinY = y;
          if (x > markMaxX) markMaxX = x;
          if (y > markMaxY) markMaxY = y;
        }
      }
    }
  }

  // 1. Découpage du logo complet (Emblème + Texte "Serenity")
  const padFullX = Math.max(4, Math.round((maxX - minX + 1) * 0.03));
  const padFullY = Math.max(4, Math.round((maxY - minY + 1) * 0.05));
  const fullLeft = Math.max(0, minX - padFullX);
  const fullTop = Math.max(0, minY - padFullY);
  const fullWidth = Math.min(width - fullLeft, (maxX - minX + 1) + padFullX * 2);
  const fullHeight = Math.min(height - fullTop, (maxY - minY + 1) + padFullY * 2);

  const fullCropped = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: fullLeft, top: fullTop, width: fullWidth, height: fullHeight })
    .png()
    .toBuffer();

  // 2. Découpage de l'emblème seul avec fond 100% transparent (SANS carré noir !)
  const padMarkX = Math.max(2, Math.round((markMaxX - markMinX + 1) * 0.04));
  const padMarkY = Math.max(2, Math.round((markMaxY - markMinY + 1) * 0.04));
  const markLeft = Math.max(0, markMinX - padMarkX);
  const markTop = Math.max(0, markMinY - padMarkY);
  const markWidth = Math.min(width - markLeft, (markMaxX - markMinX + 1) + padMarkX * 2);
  const markHeight = Math.min(height - markTop, (markMaxY - markMinY + 1) + padMarkY * 2);

  const markCropped = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: markLeft, top: markTop, width: markWidth, height: markHeight })
    .resize(1024, 1024, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fond 100% transparent pur
    })
    .png()
    .toBuffer();

  return { fullCropped, markCropped };
}

async function resizePng(source, size) {
  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const { fullCropped, markCropped } = await processLogos();

// 1. Sauvegarde du logo bannière complet pour la TitleBar
writeFileSync(join(assetsDir, "logo.png"), fullCropped);
writeFileSync(join(resourcesDir, "logo.png"), fullCropped);

// 2. Sauvegarde de l'icône de marque 100% transparente (sans boîte noire) pour Windows & barre des tâches
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoBuffers = await Promise.all(icoSizes.map((size) => resizePng(markCropped, size)));

const icoData = await pngToIco(icoBuffers);
writeFileSync(join(buildDir, "icon.ico"), icoData);
writeFileSync(join(resourcesDir, "icon.ico"), icoData);
writeFileSync(join(buildDir, "icon.png"), await resizePng(markCropped, 512));
writeFileSync(join(resourcesDir, "app-icon-256.png"), await resizePng(markCropped, 256));
writeFileSync(join(assetsDir, "logo-mark.png"), await resizePng(markCropped, 256));
writeFileSync(join(resourcesDir, "logo-mark.png"), await resizePng(markCropped, 256));

// 3. Sauvegarde des icônes de la zone de notification (Tray)
const trayOutputs = [
  ["tray-icon-16.png", 16],
  ["tray-icon-16@2x.png", 32],
  ["tray-icon-32.png", 32],
  ["tray-icon-32@2x.png", 64],
];

for (const [filename, size] of trayOutputs) {
  writeFileSync(join(resourcesDir, filename), await resizePng(markCropped, size));
}

console.log("Logos générés avec succès : Fond 100% transparent sans carré noir.");
