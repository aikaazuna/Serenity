import { BrowserWindow, clipboard, dialog, ipcMain, app } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import util from "node:util";
const execAsync = util.promisify(exec);
import { IpcChannels, type StoreKey, type StoreSchema, type WindowStatePayload } from "../shared/types.js";
import { store } from "./store.js";
import { cancelPicker, confirmPicker, getPickerInitForWebContents, startPicker } from "./windows/pickerWindows.js";
import { registerPickerShortcut } from "./shortcuts.js";
import { setAutostart, getAutostart } from "./autostart.js";
import { getMainWindow } from "./windows/mainWindow.js";
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  dismissUpdate,
  openReleasePage,
} from "./updater.js";

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
      const { stdout } = await execAsync(
        'reg.exe query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render" /s',
        {
          encoding: "utf8",
          maxBuffer: 1024 * 1024 * 10,
        }
      );

      const sections = stdout.split(/HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\MMDevices\\Audio\\Render\\[^\\]+\\Properties/i);
      const devices = [{ name: "Toutes les sorties audio", isInstalled: true }];
      const foundNames: string[] = [];

      for (const section of sections) {
        const nameMatch = section.match(/\{a45c254e-df1c-4efd-8020-67d146a850e0\},2\s+REG_SZ\s+([^\r\n]+)/i);
        const descMatch = section.match(/\{b3f8fa53-0004-438e-9003-51a46e139bfc\},6\s+REG_SZ\s+([^\r\n]+)/i);

        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim();
          const desc = descMatch && descMatch[1] ? descMatch[1].trim() : "";
          const displayName = desc && desc !== name ? `${name} (${desc})` : name;
          foundNames.push(displayName);
        }
      }

      const unique = Array.from(new Set(foundNames)).sort();
      for (const d of unique) {
        devices.push({ name: d, isInstalled: true });
      }

      return devices;
    } catch (e) {
      console.error("Failed to get audio devices via reg.exe", e);
      return [{ name: "Toutes les sorties audio", isInstalled: true }];
    }
  });
}
