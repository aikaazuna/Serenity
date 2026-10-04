import { app } from "electron";
import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import fsSync from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

/**
 * Chemin vers ffmpeg.exe.
 * - Packagé : copié dans `resources/ffmpeg.exe` via `extraResources` (electron-builder).
 * - Dev : binaire fourni par le paquet `ffmpeg-static` (devDependency).
 */
export function getFfmpegPath(): string | null {
  if (app.isPackaged) {
    const packaged = path.join(process.resourcesPath, "ffmpeg.exe");
    return fsSync.existsSync(packaged) ? packaged : null;
  }
  try {
    const devPath = require("ffmpeg-static") as string | null;
    return devPath && fsSync.existsSync(devPath) ? devPath : null;
  } catch {
    return null;
  }
}

export function runFfmpeg(args: string[], timeoutMs = 180_000): Promise<void> {
  const bin = getFfmpegPath();
  if (!bin) return Promise.reject(new Error("ffmpeg introuvable"));

  return new Promise((resolve, reject) => {
    execFile(
      bin,
      ["-hide_banner", "-loglevel", "error", "-y", ...args],
      { windowsHide: true, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 },
      (err, _stdout, stderr) => {
        if (err) {
          reject(new Error(`ffmpeg a échoué: ${stderr?.toString().trim() || err.message}`));
        } else {
          resolve();
        }
      }
    );
  });
}
