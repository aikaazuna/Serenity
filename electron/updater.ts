import { app, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import {
  IpcChannels,
  type UpdateCheckResult,
  type UpdateInfo,
  type UpdateProgress,
} from "../shared/types.js";
import { store } from "./store.js";
import { compareSemver, parseReleaseTag } from "./updaterUtils.js";
import { getMainWindow } from "./windows/mainWindow.js";

const GITHUB_OWNER = "aikaazuna";
const GITHUB_REPO = "Serenity";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const CHECK_DELAY_MS = 3000;

let pendingUpdate: UpdateInfo | null = null;
let downloadedFilePath: string | null = null;
let checkTimer: NodeJS.Timeout | null = null;

export function isPortableBuild(): boolean {
  return !!process.env.PORTABLE_EXECUTABLE_DIR;
}

function getUpdateDir(): string {
  return path.join(app.getPath("temp"), "serenity-updates");
}

function sendToRenderer<T>(channel: string, payload: T): void {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

function emitProgress(progress: UpdateProgress): void {
  sendToRenderer(IpcChannels.UpdaterOnProgress, progress);
}

function emitError(message: string): void {
  sendToRenderer(IpcChannels.UpdaterOnError, { message });
}

interface GitHubReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  body: string | null;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(GITHUB_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Serenity-Hub-Updater",
      },
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return (await response.json()) as GitHubRelease;
  } catch (error) {
    console.error("[updater] Fetch failed:", error);
    return null;
  }
}

function findAsset(release: GitHubRelease, version: string): GitHubReleaseAsset | undefined {
  const isPortable = isPortableBuild();
  const candidates = isPortable
    ? [
        `SerenityHub-Portable-${version}.exe`,
        `Serenity-Hub-Portable-${version}.exe`,
        `SerenityHub-Portable.exe`,
        `Portable-${version}.exe`,
      ]
    : [
        `SerenityHub-Setup-${version}.exe`,
        `Serenity-Hub-Setup-${version}.exe`,
        `SerenityHub-Setup.exe`,
        `Setup-${version}.exe`,
      ];

  for (const candidate of candidates) {
    const match = release.assets.find(
      (a) => a.name.toLowerCase() === candidate.toLowerCase()
    );
    if (match) return match;
  }

  if (isPortable) {
    const port = release.assets.find(
      (a) => a.name.toLowerCase().includes("portable") && a.name.endsWith(".exe")
    );
    if (port) return port;
  } else {
    const setup = release.assets.find(
      (a) =>
        (a.name.toLowerCase().includes("setup") ||
          a.name.toLowerCase().includes("installer")) &&
        a.name.endsWith(".exe")
    );
    if (setup) return setup;
  }

  return release.assets.find((a) => a.name.endsWith(".exe"));
}

export async function checkForUpdates(manual = false): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion() || "1.0.0";
  const updateStore = store.get("update");
  const dismissedVersion = updateStore.dismissedVersion;

  try {
    const release = await fetchLatestRelease();
    if (!release) {
      return { status: "upToDate" };
    }

    const version = parseReleaseTag(release.tag_name);

    // Si la version distante <= version locale
    if (compareSemver(version, currentVersion) <= 0) {
      store.set("update", { ...updateStore, lastCheckAt: Date.now() });
      return { status: "upToDate" };
    }

    if (!manual && dismissedVersion === version) {
      return { status: "upToDate" };
    }

    const asset = findAsset(release, version);
    const info: UpdateInfo = {
      version,
      currentVersion,
      releaseNotes: release.body ?? "",
      releaseUrl: release.html_url,
      downloadUrl: asset?.browser_download_url ?? release.html_url,
      assetName: asset?.name ?? `Serenity-Hub-${version}.exe`,
      assetSize: asset?.size ?? 0,
      isPortable: isPortableBuild(),
    };

    pendingUpdate = info;
    store.set("update", { ...updateStore, lastCheckAt: Date.now() });
    sendToRenderer(IpcChannels.UpdaterOnAvailable, info);
    return { status: "available", info };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[updater] Check failed:", message);
    if (manual) emitError(message);
    return { status: "error", message };
  }
}

function downloadFile(url: string, destPath: string, totalBytes: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let received = 0;

    const request = (downloadUrl: string) => {
      https
        .get(downloadUrl, { headers: { "User-Agent": "Serenity-Hub-Updater" } }, (response) => {
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            request(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${response.statusCode}`));
            return;
          }

          const contentLength =
            parseInt(response.headers["content-length"] ?? "0", 10) || totalBytes;

          response.on("data", (chunk: Buffer) => {
            received += chunk.length;
            const percent =
              contentLength > 0 ? Math.min(99, Math.round((received / contentLength) * 100)) : 0;
            emitProgress({
              phase: "downloading",
              percent,
              message: "downloading",
              bytesReceived: received,
              totalBytes: contentLength,
            });
          });

          response.pipe(file);
          file.on("finish", () => {
            file.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => reject(err));
        });
    };

    request(url);
    file.on("error", (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

export async function downloadUpdate(): Promise<string | null> {
  if (!pendingUpdate) return null;
  const { version, downloadUrl, assetName, assetSize } = pendingUpdate;
  emitProgress({ phase: "downloading", percent: 0, message: "connecting" });

  try {
    const updateDir = getUpdateDir();
    await fsPromises.mkdir(updateDir, { recursive: true });
    const destPath = path.join(updateDir, assetName);

    await downloadFile(downloadUrl, destPath, assetSize);
    downloadedFilePath = destPath;

    emitProgress({ phase: "ready", percent: 100, message: "ready", version });
    sendToRenderer(IpcChannels.UpdaterOnReady, {
      filePath: destPath,
      version,
      isPortable: pendingUpdate.isPortable,
    });
    return destPath;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    emitError(message);
    return null;
  }
}

export async function installUpdate(): Promise<void> {
  if (!downloadedFilePath || !fs.existsSync(downloadedFilePath)) {
    emitError("Fichier d'installation introuvable");
    return;
  }

  if (isPortableBuild()) {
    await shell.openPath(downloadedFilePath);
    return;
  }

  spawn(downloadedFilePath, [], { detached: true, stdio: "ignore" }).unref();
  app.quit();
}

export function dismissUpdate(version: string): void {
  const updateStore = store.get("update");
  store.set("update", { ...updateStore, dismissedVersion: version });
  pendingUpdate = null;
}

export function openReleasePage(): void {
  if (pendingUpdate?.releaseUrl) {
    void shell.openExternal(pendingUpdate.releaseUrl);
  }
}

export function initUpdater(): void {
  if (process.env.NODE_ENV === "development") return;
  if (checkTimer) clearTimeout(checkTimer);
  checkTimer = setTimeout(() => {
    void checkForUpdates(false);
  }, CHECK_DELAY_MS);
}

export function getPendingUpdate(): UpdateInfo | null {
  return pendingUpdate;
}
