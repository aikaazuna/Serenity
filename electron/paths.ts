import path from "node:path";
import { fileURLToPath } from "node:url";

const electronDir = path.dirname(fileURLToPath(import.meta.url));

/** Chemin absolu vers le script preload compilé (même dossier que main.js). */
export function preloadScriptPath(): string {
  return path.join(electronDir, "preload.js");
}

/** Ressources statiques (icônes tray / fenêtre), copiées dans dist-electron au build. */
export function resourcePath(...segments: string[]): string {
  return path.join(electronDir, "resources", ...segments);
}

/** Fichiers HTML/JS/CSS du renderer Vite (dossier dist à la racine du package). */
export function distPath(...segments: string[]): string {
  return path.join(electronDir, "..", "..", "dist", ...segments);
}

import { app } from "electron";
import fsSync from "node:fs";

/** Chemin vers le script PowerShell audio-mixer, extrait sur disque si packagé. */
export function getAudioMixerScriptPath(): string {
  try {
    const userData = app.getPath("userData");
    const unpackedPath = path.join(userData, "audio-mixer.ps1");
    const sourcePath = resourcePath("audio-mixer.ps1");

    if (fsSync.existsSync(sourcePath)) {
      const content = fsSync.readFileSync(sourcePath, "utf8");
      if (!fsSync.existsSync(unpackedPath) || fsSync.readFileSync(unpackedPath, "utf8") !== content) {
        fsSync.writeFileSync(unpackedPath, content, "utf8");
      }
      return unpackedPath;
    }
    if (fsSync.existsSync(unpackedPath)) {
      return unpackedPath;
    }
  } catch {}
  return resourcePath("audio-mixer.ps1");
}
