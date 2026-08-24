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
