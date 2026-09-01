import { app, shell, clipboard, desktopCapturer, nativeImage, screen } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { showOverlayNotification } from "../windows/overlayWindow.js";
import { store } from "../store.js";
import type { ClipItem, StoreSchema } from "../../shared/types.js";

export function getClipsDirectory(): string {
  const settings = store.get("settings") as StoreSchema["settings"] | undefined;
  const customFolder = settings?.clips?.clipsFolder;
  const baseDir = customFolder && customFolder.trim()
    ? customFolder.trim()
    : path.join(app.getPath("videos"), "Serenity Clips");

  if (!fsSync.existsSync(baseDir)) {
    fsSync.mkdirSync(baseDir, { recursive: true });
  }
  const capturesDir = path.join(baseDir, "Captures");
  if (!fsSync.existsSync(capturesDir)) {
    fsSync.mkdirSync(capturesDir, { recursive: true });
  }

  return baseDir;
}

export async function scanClips(): Promise<ClipItem[]> {
  try {
    const baseDir = getClipsDirectory();
    const capturesDir = path.join(baseDir, "Captures");

    const items: ClipItem[] = [];

    async function processDirectory(dir: string) {
      if (!fsSync.existsSync(dir)) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const fullPath = path.join(dir, entry.name);
        const ext = path.extname(entry.name).toLowerCase();

        const isVideo = [".mp4", ".webm", ".mkv", ".mov"].includes(ext);
        const isImage = [".png", ".jpg", ".jpeg", ".webp"].includes(ext);

        if (!isVideo && !isImage) continue;

        try {
          const stats = await fs.stat(fullPath);
          let thumbnailDataUrl: string | undefined;

          if (isImage) {
            if (stats.size < 15 * 1024 * 1024) {
              const buf = await fs.readFile(fullPath);
              const img = nativeImage.createFromBuffer(buf);
              if (!img.isEmpty()) {
                const resized = img.resize({ width: 320 });
                thumbnailDataUrl = resized.toDataURL();
              }
            }
          }

          items.push({
            id: entry.name,
            filename: entry.name,
            path: fullPath,
            type: isVideo ? "video" : "screenshot",
            sizeBytes: stats.size,
            createdAt: stats.mtimeMs || stats.birthtimeMs || Date.now(),
            thumbnailDataUrl,
          });
        } catch {
          // ignore error on locked file
        }
      }
    }

    await processDirectory(baseDir);
    await processDirectory(capturesDir);

    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Failed to scan clips directory:", err);
    return [];
  }
}

export async function captureScreenshot(): Promise<ClipItem | null> {
  try {
    const baseDir = getClipsDirectory();
    const capturesDir = path.join(baseDir, "Captures");

    const primaryDisplay = screen.getPrimaryDisplay();
    const width = Math.round(primaryDisplay.bounds.width * primaryDisplay.scaleFactor);
    const height = Math.round(primaryDisplay.bounds.height * primaryDisplay.scaleFactor);

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    const primarySource =
      sources.find((s) => s.display_id === String(primaryDisplay.id)) || sources[0];

    if (!primarySource || primarySource.thumbnail.isEmpty()) {
      return null;
    }

    const image = primarySource.thumbnail;
    const pngBuffer = image.toPNG();

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `Screenshot_${dateStr}.png`;
    const fullPath = path.join(capturesDir, filename);

    await fs.writeFile(fullPath, pngBuffer);

    clipboard.writeImage(image);

    showOverlayNotification({
      type: "clip",
      title: "Capture d'écran enregistrée !",
      subtitle: "Image copiée dans le presse-papiers et sauvegardée",
      items: [],
    });

    const stats = await fs.stat(fullPath);
    return {
      id: filename,
      filename,
      path: fullPath,
      type: "screenshot",
      sizeBytes: stats.size,
      createdAt: Date.now(),
      thumbnailDataUrl: image.resize({ width: 320 }).toDataURL(),
      resolution: `${width}x${height}`,
    };
  } catch (err) {
    console.error("Failed to capture screenshot:", err);
    return null;
  }
}

export async function saveVideoBlob(
  buffer: Buffer,
  filename?: string,
  durationSeconds: number = 30
): Promise<ClipItem | null> {
  try {
    const baseDir = getClipsDirectory();
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const finalFilename = filename || `Clip_${dateStr}.webm`;
    const fullPath = path.join(baseDir, finalFilename);

    await fs.writeFile(fullPath, buffer);

    showOverlayNotification({
      type: "clip",
      title: `Clip ${durationSeconds}s enregistré !`,
      subtitle: "Fichier sauvegardé dans Serenity Clips",
      clipDurationSeconds: durationSeconds,
      items: [],
    });

    const stats = await fs.stat(fullPath);
    return {
      id: finalFilename,
      filename: finalFilename,
      path: fullPath,
      type: "video",
      sizeBytes: stats.size,
      createdAt: Date.now(),
      durationSeconds,
    };
  } catch (err) {
    console.error("Failed to save video blob:", err);
    return null;
  }
}

export async function deleteClip(filePath: string): Promise<boolean> {
  try {
    if (fsSync.existsSync(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Failed to delete clip:", err);
    return false;
  }
}

export async function openClipsFolder(): Promise<boolean> {
  try {
    const dir = getClipsDirectory();
    await shell.openPath(dir);
    return true;
  } catch (err) {
    console.error("Failed to open clips directory:", err);
    return false;
  }
}
