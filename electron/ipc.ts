import { BrowserWindow, clipboard, dialog, ipcMain, app } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { exec, spawn, type ChildProcess } from "node:child_process";
import util from "node:util";
const execAsync = util.promisify(exec);
import { IpcChannels, type StoreKey, type StoreSchema, type WindowStatePayload } from "../shared/types.js";
import { store } from "./store.js";
import { cancelPicker, confirmPicker, getPickerInitForWebContents, startPicker } from "./windows/pickerWindows.js";
import { registerPickerShortcut, registerMixerShortcuts } from "./shortcuts.js";
import { setAutostart, getAutostart } from "./autostart.js";
import { getMainWindow } from "./windows/mainWindow.js";
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  dismissUpdate,
  openReleasePage,
} from "./updater.js";
import { showOverlayNotification, getOverlayInitPayload } from "./windows/overlayWindow.js";
import { getAudioMixerScriptPath } from "./paths.js";

function broadcastStoreChange<K extends StoreKey>(key: K, value: StoreSchema[K]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IpcChannels.StoreOnChanged, { key, value });
  }
}

/** Enregistre tous les handlers IPC. Doit être appelé une seule fois au démarrage. */
export function registerIpcHandlers(): void {
  // Fenêtre principale (contrôles de la barre de titre custom)
  ipcMain.on(IpcChannels.WindowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on(IpcChannels.WindowToggleMaximize, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on(IpcChannels.WindowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.handle(IpcChannels.WindowGetState, (event): WindowStatePayload => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return {
      isMaximized: win?.isMaximized() ?? false,
      isMinimized: win?.isMinimized() ?? false,
    };
  });

  // Pipette système
  ipcMain.handle(IpcChannels.PickerStart, () => startPicker());
  ipcMain.handle(IpcChannels.PickerRequestInit, (event) =>
    getPickerInitForWebContents(event.sender.id),
  );
  ipcMain.on(IpcChannels.PickerCancel, () => cancelPicker());
  ipcMain.on(IpcChannels.PickerConfirm, (_event, hex: string) => confirmPicker(hex));

  // Presse-papiers
  ipcMain.on(IpcChannels.ClipboardWriteText, (_event, text: string) => {
    clipboard.writeText(text);
  });

  // Stockage local typé (settings / history / favorites / collections)
  ipcMain.handle(IpcChannels.StoreGet, (_event, key: StoreKey) => {
    return store.get(key);
  });

  ipcMain.handle(IpcChannels.StoreSet, (_event, key: StoreKey, value: unknown) => {
    store.set(key, value as never);

    if (key === "settings") {
      const settings = value as StoreSchema["settings"];
      registerPickerShortcut(settings.pickerShortcut);
      setAutostart(settings.launchAtStartup);
    }

    broadcastStoreChange(key, value as never);
    return true;
  });

  // Raccourci global
  ipcMain.handle(IpcChannels.ShortcutUpdate, (_event, accelerator: string) => {
    return registerPickerShortcut(accelerator);
  });

  // Démarrage automatique avec Windows
  ipcMain.handle(IpcChannels.AutostartGet, () => getAutostart());
  ipcMain.handle(IpcChannels.AutostartSet, (_event, enabled: boolean) => {
    setAutostart(enabled);
    return getAutostart();
  });

  // Export de fichiers (JSON / CSS / SCSS / Tailwind / PNG)
  ipcMain.handle(
    IpcChannels.ExportSaveFile,
    async (_event, payload: { defaultName: string; content: string; filters: { name: string; extensions: string[] }[] }) => {
      const win = getMainWindow();
      const dialogOptions = { defaultPath: payload.defaultName, filters: payload.filters };
      const { canceled, filePath } = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);
      if (canceled || !filePath) return { success: false as const };
      await fs.writeFile(filePath, payload.content, "utf-8");
      return { success: true as const, filePath };
    },
  );

  ipcMain.handle(
    IpcChannels.ExportSavePng,
    async (_event, payload: { defaultName: string; dataUrl: string }) => {
      const win = getMainWindow();
      const dialogOptions = {
        defaultPath: payload.defaultName,
        filters: [{ name: "Image PNG", extensions: ["png"] }],
      };
      const { canceled, filePath } = win
        ? await dialog.showSaveDialog(win, dialogOptions)
        : await dialog.showSaveDialog(dialogOptions);
      if (canceled || !filePath) return { success: false as const };
      const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, "");
      await fs.writeFile(filePath, Buffer.from(base64, "base64"));
      return { success: true as const, filePath };
    },
  );

  // Cycle de vie
  ipcMain.handle(IpcChannels.AppGetVersion, () => app.getVersion());
  ipcMain.on(IpcChannels.AppQuit, () => app.quit());

  // Mises à jour logicielles
  ipcMain.handle(IpcChannels.UpdaterCheck, () => checkForUpdates(true));
  ipcMain.handle(IpcChannels.UpdaterDownload, () => downloadUpdate());
  ipcMain.handle(IpcChannels.UpdaterInstall, () => installUpdate());
  ipcMain.on(IpcChannels.UpdaterDismiss, (_event, version: string) => dismissUpdate(version));
  ipcMain.on(IpcChannels.UpdaterOpenRelease, () => openReleasePage());

  // Audio / APO
  const apoPath = "C:\\Program Files\\EqualizerAPO\\config\\config.txt";
  const apoDir = "C:\\Program Files\\EqualizerAPO\\config";

  ipcMain.handle(IpcChannels.AudioReadConfig, async () => {
    try {
      if (fsSync.existsSync(apoPath)) {
        return await fs.readFile(apoPath, "utf8");
      }
    } catch (e) {
      console.error("Failed to read APO config", e);
    }
    return "";
  });

  ipcMain.handle(IpcChannels.AudioWriteConfig, async (_event, content: string) => {
    try {
      if (!fsSync.existsSync(apoDir)) return false;
      const backupPath = path.join(apoDir, "config.backup.txt");
      if (!fsSync.existsSync(backupPath) && fsSync.existsSync(apoPath)) {
        await fs.copyFile(apoPath, backupPath);
      }
      await fs.writeFile(apoPath, content, "utf8");
      return true;
    } catch (e) {
      console.error("Failed to write APO config", e);
      return false;
    }
  });

  ipcMain.handle(IpcChannels.AudioGetApoPath, () => {
    return apoPath;
  });

  ipcMain.handle(IpcChannels.AudioCheckApoInstalled, () => {
    return fsSync.existsSync(apoDir);
  });

  ipcMain.handle(IpcChannels.AudioGetDevices, async () => {
    try {
      // 1. Try registry query via PowerShell JSON output for 100% reliable UTF-8 decoding & friendly names
      const psCommand = `powershell.exe -NoProfile -NonInteractive -Command "try { Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render\\*\\Properties' -ErrorAction SilentlyContinue | ForEach-Object { $name = $_.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'; $desc = $_.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'; if ($name) { if ($desc -and $desc -ne $name) { \\\"$name ($desc)\\\" } else { \\\"$name\\\" } } } | Sort-Object -Unique | ConvertTo-Json -Compress } catch { @() }"`;
      
      let foundNames: string[] = [];
      try {
        const { stdout } = await execAsync(psCommand, { encoding: "utf8", timeout: 4000 });
        if (stdout && stdout.trim()) {
          const parsed = JSON.parse(stdout.trim());
          if (Array.isArray(parsed)) foundNames = parsed.filter(Boolean);
          else if (typeof parsed === "string" && parsed.trim()) foundNames = [parsed.trim()];
        }
      } catch (err) {
        console.warn("PowerShell registry device query failed, trying Win32_SoundDevice fallback", err);
      }

      if (foundNames.length === 0) {
        // Fallback to Win32_SoundDevice
        try {
          const { stdout: soundStdout } = await execAsync(
            `powershell.exe -NoProfile -NonInteractive -Command "Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name | Sort-Object -Unique | ConvertTo-Json -Compress"`,
            { encoding: "utf8", timeout: 3000 }
          );
          if (soundStdout && soundStdout.trim()) {
            const parsedSound = JSON.parse(soundStdout.trim());
            if (Array.isArray(parsedSound)) foundNames = parsedSound.filter(Boolean);
            else if (typeof parsedSound === "string" && parsedSound.trim()) foundNames = [parsedSound.trim()];
          }
        } catch {}
      }

      const devices = [{ name: "Toutes les sorties audio", isInstalled: true }];
      const unique = Array.from(new Set(foundNames)).sort();
      for (const d of unique) {
        if (d && typeof d === "string" && d.trim()) {
          devices.push({ name: d.trim(), isInstalled: true });
        }
      }

      return devices;
    } catch (e) {
      console.error("Failed to get audio devices", e);
      return [{ name: "Toutes les sorties audio", isInstalled: true }];
    }
  });

  // Overlay Global Système
  ipcMain.on(IpcChannels.OverlayShow, (_event, payload) => {
    if (payload) {
      showOverlayNotification(payload);
    }
  });

  ipcMain.handle(IpcChannels.OverlayRequestInit, () => {
    return getOverlayInitPayload();
  });

  // Enregistrement des raccourcis globaux du Mixer
  ipcMain.handle(IpcChannels.MixerRegisterShortcuts, (_event, bindings) => {
    return registerMixerShortcuts(bindings);
  });

  // Mixer Persistent CoreAudio Worker (Zero-Latency, No process spawn overhead)
  let mixerWorker: ChildProcess | null = null;
  let stdoutBuffer = "";
  const pendingResolvers: Array<(data: string) => void> = [];

  function getMixerWorker(): ChildProcess {
    if (mixerWorker && !mixerWorker.killed && mixerWorker.exitCode === null) {
      return mixerWorker;
    }

    const scriptPath = getAudioMixerScriptPath();
    mixerWorker = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-Action", "server"],
      {
        windowsHide: true,
        stdio: ["pipe", "pipe", "ignore"],
      }
    );

    stdoutBuffer = "";
    mixerWorker.stdout?.setEncoding("utf8");
    mixerWorker.stdout?.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      let newlineIdx: number;
      while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIdx).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
        if (line) {
          const resolve = pendingResolvers.shift();
          if (resolve) resolve(line);
        }
      }
    });

    mixerWorker.on("exit", () => {
      mixerWorker = null;
      while (pendingResolvers.length > 0) {
        const resolve = pendingResolvers.shift();
        if (resolve) resolve("");
      }
    });

    return mixerWorker;
  }

  function sendMixerCommand(cmd: object): Promise<string> {
    return new Promise((resolve) => {
      try {
        const worker = getMixerWorker();
        pendingResolvers.push(resolve);
        worker.stdin?.write(JSON.stringify(cmd) + "\n");
      } catch {
        resolve("");
      }
    });
  }

  // Mixer WASAPI Audio Sessions & Volume Handlers
  ipcMain.handle(IpcChannels.MixerGetSessions, async () => {
    try {
      const out = await sendMixerCommand({ action: "list" });
      if (out && out.trim()) {
        const parsed = JSON.parse(out.trim());
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  ipcMain.handle(IpcChannels.MixerGetPeaks, async () => {
    try {
      const out = await sendMixerCommand({ action: "peaks" });
      if (out && out.trim()) {
        const parsed = JSON.parse(out.trim());
        if (typeof parsed === "object" && parsed !== null) return parsed;
      }
      return { master: 0 };
    } catch {
      return { master: 0 };
    }
  });

  ipcMain.handle(IpcChannels.MixerSetProcessVolume, async (_event, { processName, volume }) => {
    try {
      const scalar = Math.max(0, Math.min(1, volume / 100));
      void sendMixerCommand({ action: "set-process-volume", processName, volume: scalar });
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetProcessMute, async (_event, { processName, isMuted }) => {
    try {
      void sendMixerCommand({ action: "set-process-mute", processName, isMuted: Boolean(isMuted) });
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetMasterVolume, async (_event, volume) => {
    try {
      const scalar = Math.max(0, Math.min(1, volume / 100));
      void sendMixerCommand({ action: "set-master-volume", volume: scalar });
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetMasterMute, async (_event, isMuted) => {
    try {
      void sendMixerCommand({ action: "set-master-mute", isMuted: Boolean(isMuted) });
      return true;
    } catch {
      return false;
    }
  });

  // New IPC channel to show a single HUD item via MixerShowHud
  ipcMain.handle(IpcChannels.MixerShowHud, async (_event, hud) => {
    try {
      // hud is an OverlayNotificationItem
      showOverlayNotification({ type: "volume", items: [hud] });
      return true;
    } catch {
      return false;
    }
  });
}
