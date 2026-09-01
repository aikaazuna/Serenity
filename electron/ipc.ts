import { BrowserWindow, clipboard, dialog, ipcMain, app, shell, desktopCapturer } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { exec, spawn, type ChildProcess } from "node:child_process";
import util from "node:util";
const execAsync = util.promisify(exec);
import { IpcChannels, type StoreKey, type StoreSchema, type WindowStatePayload } from "../shared/types.js";
import { store } from "./store.js";
import { cancelPicker, confirmPicker, getPickerInitForWebContents, startPicker } from "./windows/pickerWindows.js";
import { registerPickerShortcut, registerMixerShortcuts, registerClipsShortcuts, unregisterAllShortcuts, updateChannelStates } from "./shortcuts.js";
import { scanClips, captureScreenshot, saveVideoBlob, deleteClip, openClipsFolder } from "./clips/clipsManager.js";
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
import { getAudioMixerBinaryPath } from "./paths.js";

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
      registerClipsShortcuts(settings.clips);
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
      const psScript = `
$apoDir = 'C:\\Program Files\\EqualizerAPO'
$backupFiles = @()
if (Test-Path $apoDir) {
  $backupFiles = (Get-ChildItem -Path $apoDir -Filter 'backup_*.reg' -ErrorAction SilentlyContinue).BaseName
}

$results = @()
$renderKeys = Get-ChildItem 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render' -ErrorAction SilentlyContinue

foreach ($rk in $renderKeys) {
  $guid = $rk.PSChildName
  $props = Get-ItemProperty "$($rk.PSPath)\\Properties" -ErrorAction SilentlyContinue
  if (-not $props) { continue }
  
  $name = $props.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
  $desc = $props.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'
  if (-not $name) { continue }
  
  $fullName = if ($desc -and ($desc -ne $name)) { "$name ($desc)" } else { $name }
  
  $isApo = $false
  $fx = Get-ItemProperty "$($rk.PSPath)\\FxProperties" -ErrorAction SilentlyContinue
  if ($fx) {
    foreach ($p in $fx.PSObject.Properties) {
      $val = [string]$p.Value
      if ($val -and ($val -like '*EACD2258*' -or $val -like '*E07010C0*' -or $val -like '*EqualizerAPO*')) {
        $isApo = $true
        break
      }
    }
  }
  
  if (-not $isApo) {
    foreach ($b in $backupFiles) {
      if (($name -and ($b -like "*$name*")) -or ($desc -and ($b -like "*$desc*"))) {
        $isApo = $true
        break
      }
    }
  }
  
  $results += [PSCustomObject]@{
    name = $fullName
    guid = $guid
    isInstalled = $isApo
  }
}

$results | ConvertTo-Json -Compress
`;

      const b64 = Buffer.from(psScript, "utf16le").toString("base64");
      const { stdout } = await execAsync(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${b64}`, {
        encoding: "utf8",
        timeout: 5000,
      });

      let foundList: { name: string; isInstalled: boolean }[] = [];
      if (stdout && stdout.trim()) {
        const parsed = JSON.parse(stdout.trim());
        if (Array.isArray(parsed)) {
          foundList = parsed.map((d: any) => ({
            name: String(d.name || "").trim(),
            isInstalled: Boolean(d.isInstalled),
          })).filter((d) => d.name);
        } else if (parsed && typeof parsed === "object" && parsed.name) {
          foundList = [{ name: String(parsed.name).trim(), isInstalled: Boolean(parsed.isInstalled) }];
        }
      }

      // Deduplicate by name, keeping isInstalled = true if duplicate
      const map = new Map<string, boolean>();
      for (const d of foundList) {
        if (!map.has(d.name) || d.isInstalled) {
          map.set(d.name, d.isInstalled);
        }
      }

      const devices: { name: string; isInstalled: boolean }[] = [
        { name: "Toutes les sorties audio", isInstalled: true }
      ];
      for (const [name, isInstalled] of map.entries()) {
        devices.push({ name, isInstalled });
      }

      return devices;
    } catch (e) {
      console.error("Failed to get audio devices", e);
      return [{ name: "Toutes les sorties audio", isInstalled: true }];
    }
  });

  // Ouvre le configurateur de périphériques Equalizer APO
  ipcMain.handle(IpcChannels.AudioOpenDeviceSelector, async () => {
    try {
      const candidates = [
        "C:\\Program Files\\EqualizerAPO\\DeviceSelector.exe",
        "C:\\Program Files\\EqualizerAPO\\Configurator.exe",
        "C:\\Program Files\\EqualizerAPO\\Editor.exe",
        "C:\\Program Files (x86)\\EqualizerAPO\\DeviceSelector.exe",
        "C:\\Program Files (x86)\\EqualizerAPO\\Configurator.exe",
      ];
      for (const c of candidates) {
        if (fsSync.existsSync(c)) {
          spawn(c, [], { detached: true, stdio: "ignore" }).unref();
          return true;
        }
      }
      if (fsSync.existsSync("C:\\Program Files\\EqualizerAPO")) {
        void shell.openPath("C:\\Program Files\\EqualizerAPO");
        return true;
      }
      void shell.openExternal("https://sourceforge.net/projects/equalizerapo/");
      return false;
    } catch (err) {
      console.error("Failed to open device selector:", err);
      return false;
    }
  });

  // Overlay Global Système
  ipcMain.on(IpcChannels.OverlayShow, (_event, payload) => {
    if (payload) {
      const settings = store.get("settings") as StoreSchema["settings"] | undefined;
      showOverlayNotification({
        ...payload,
        settings: {
          ...settings?.overlay,
          ...(payload.settings || {}),
        },
      });
    }
  });

  ipcMain.handle(IpcChannels.OverlayRequestInit, () => {
    return getOverlayInitPayload();
  });

  // Enregistrement des raccourcis globaux du Mixer
  ipcMain.handle(IpcChannels.MixerRegisterShortcuts, (_event, bindings) => {
    return registerMixerShortcuts(bindings, sendMixerCommand);
  });

  // Synchronisation de l'état des canaux mixer (volumes, mutes, processus) vers le main process
  ipcMain.handle(IpcChannels.MixerSyncState, (_event, states) => {
    try {
      if (Array.isArray(states)) {
        updateChannelStates(states);
      }
      return true;
    } catch {
      return false;
    }
  });

  // Mixer Persistent CoreAudio Worker (Zero-Latency, No process spawn overhead)
  let mixerWorker: ChildProcess | null = null;
  let stdoutBuffer = "";
  let nextRequestId = 1;
  const pendingRequests = new Map<number, (data: any) => void>();

  function getMixerWorker(): ChildProcess {
    if (mixerWorker && !mixerWorker.killed && mixerWorker.exitCode === null) {
      return mixerWorker;
    }

    const exePath = getAudioMixerBinaryPath();
    mixerWorker = spawn(exePath, ["server"], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "ignore"],
    });

    stdoutBuffer = "";
    mixerWorker.stdout?.setEncoding("utf8");
    mixerWorker.stdout?.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      let newlineIdx: number;
      while ((newlineIdx = stdoutBuffer.indexOf("\n")) !== -1) {
        const line = stdoutBuffer.slice(0, newlineIdx).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIdx + 1);
        if (line) {
          try {
            const res = JSON.parse(line);
            if (res && typeof res.id === "number") {
              const resolve = pendingRequests.get(res.id);
              if (resolve) {
                pendingRequests.delete(res.id);
                resolve(res.data);
              }
            }
          } catch {
            // Ignore non-json or malformed line
          }
        }
      }
    });

    mixerWorker.on("exit", () => {
      mixerWorker = null;
      for (const resolve of pendingRequests.values()) {
        resolve(null);
      }
      pendingRequests.clear();
    });

    return mixerWorker;
  }

  function sendMixerCommand(cmd: Record<string, any>): Promise<any> {
    return new Promise((resolve) => {
      try {
        const worker = getMixerWorker();
        const id = nextRequestId++;
        if (nextRequestId > 1000000) nextRequestId = 1;
        pendingRequests.set(id, resolve);
        worker.stdin?.write(JSON.stringify({ id, ...cmd }) + "\n");
      } catch {
        resolve(null);
      }
    });
  }

  // Mixer WASAPI Audio Sessions & Volume Handlers
  ipcMain.handle(IpcChannels.MixerGetSessions, async () => {
    try {
      const data = await sendMixerCommand({ action: "list" });
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  });

  ipcMain.handle(IpcChannels.MixerGetPeaks, async () => {
    try {
      const data = await sendMixerCommand({ action: "peaks" });
      if (typeof data === "object" && data !== null) return data;
      return { master: 0 };
    } catch {
      return { master: 0 };
    }
  });

  ipcMain.handle(IpcChannels.MixerSetProcessVolume, async (_event, { processName, volume }) => {
    try {
      const scalar = Math.max(0, Math.min(1, volume / 100));
      const res = await sendMixerCommand({ action: "set-process-volume", processName, volume: scalar });
      return Boolean(res);
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetProcessMute, async (_event, { processName, isMuted }) => {
    try {
      const res = await sendMixerCommand({ action: "set-process-mute", processName, isMuted: Boolean(isMuted) });
      return Boolean(res);
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetMasterVolume, async (_event, volume) => {
    try {
      const scalar = Math.max(0, Math.min(1, volume / 100));
      const res = await sendMixerCommand({ action: "set-master-volume", volume: scalar });
      return Boolean(res);
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerSetMasterMute, async (_event, isMuted) => {
    try {
      const res = await sendMixerCommand({ action: "set-master-mute", isMuted: Boolean(isMuted) });
      return Boolean(res);
    } catch {
      return false;
    }
  });

  // HUD Overlay : appelé par le renderer via serenity.mixer.showHud()
  ipcMain.handle(IpcChannels.MixerShowHud, (_event, hudItem) => {
    try {
      if (!hudItem) return false;
      const settings = store.get("settings") as StoreSchema["settings"] | undefined;
      showOverlayNotification({
        type: "volume",
        items: [hudItem],
        settings: {
          ...settings?.overlay,
        },
      });
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(IpcChannels.MixerResetVolumes, async () => {
    try {
      const res = await sendMixerCommand({ action: "reset-volumes" });
      return Boolean(res);
    } catch {
      return false;
    }
  });

  // Unregister all global shortcuts for mixer (used when mixer is disabled)
  ipcMain.handle(IpcChannels.MixerUnregisterShortcuts, async () => {
    try {
      unregisterAllShortcuts();
      return true;
    } catch {
      return false;
    }
  });

  // Clips & Screenshots Handlers
  ipcMain.handle(IpcChannels.ClipsGetFiles, async () => {
    return await scanClips();
  });

  ipcMain.handle(IpcChannels.ClipsGetDesktopSources, async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 150, height: 150 },
    });
    return sources.map((s: any) => ({
      id: s.id,
      name: s.name,
    }));
  });

  ipcMain.handle(IpcChannels.ClipsTakeScreenshot, async () => {
    return await captureScreenshot();
  });

  ipcMain.handle(IpcChannels.ClipsSaveReplay, async (_event, durationSeconds?: number) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(IpcChannels.ClipsOnReplayTriggered, durationSeconds);
      }
    }
    return true;
  });

  ipcMain.handle(IpcChannels.ClipsSaveVideoBlob, async (_event, payload: { buffer: ArrayBuffer; filename?: string; durationSeconds?: number }) => {
    if (!payload?.buffer) return null;
    const buf = Buffer.from(payload.buffer);
    return await saveVideoBlob(buf, payload.filename, payload.durationSeconds);
  });

  ipcMain.handle(IpcChannels.ClipsOpenFolder, async () => {
    return await openClipsFolder();
  });

  ipcMain.handle(IpcChannels.ClipsDeleteFile, async (_event, filePath: string) => {
    return await deleteClip(filePath);
  });

  ipcMain.handle(IpcChannels.ClipsRegisterShortcuts, async (_event, settings: any) => {
    return registerClipsShortcuts(settings);
  });
}

