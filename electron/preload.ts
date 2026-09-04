import { contextBridge, ipcRenderer } from "electron";
import {
  IpcChannels,
  type PickerCapturedPayload,
  type PickerWindowInitPayload,
  type StoreKey,
  type StoreSchema,
  type UpdateCheckResult,
  type UpdateErrorPayload,
  type UpdateInfo,
  type UpdateProgress,
  type UpdateReadyPayload,
  type WindowStatePayload,
} from "../shared/types.js";
import type { SerenityApi } from "../shared/preloadApi.js";

/**
 * Seule porte d'entrée entre le monde Node/Electron et le renderer.
 * `contextIsolation: true` + `nodeIntegration: false` + `sandbox: true` garantissent
 * que React n'a jamais accès direct à `require`, `fs`, `process`, etc.
 * On n'expose ici que des fonctions typées et des canaux IPC explicites.
 */

type Unsubscribe = () => void;

function on<T>(channel: string, callback: (payload: T) => void): Unsubscribe {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

const SerenityApi: SerenityApi = {
  window: {
    minimize: () => ipcRenderer.send(IpcChannels.WindowMinimize),
    toggleMaximize: () => ipcRenderer.send(IpcChannels.WindowToggleMaximize),
    close: () => ipcRenderer.send(IpcChannels.WindowClose),
    getState: (): Promise<WindowStatePayload> => ipcRenderer.invoke(IpcChannels.WindowGetState),
    onStateChanged: (cb: (payload: WindowStatePayload) => void) =>
      on<WindowStatePayload>(IpcChannels.WindowOnStateChanged, cb),
  },

  picker: {
    start: (): Promise<void> => ipcRenderer.invoke(IpcChannels.PickerStart),
    cancel: () => ipcRenderer.send(IpcChannels.PickerCancel),
    confirm: (hex: string) => ipcRenderer.send(IpcChannels.PickerConfirm, hex),
    onOpen: (cb: () => void) => on<void>(IpcChannels.PickerOnOpen, cb),
    onCaptured: (cb: (payload: PickerCapturedPayload) => void) =>
      on<PickerCapturedPayload>(IpcChannels.PickerOnCaptured, cb),
    onCancelled: (cb: () => void) => on<void>(IpcChannels.PickerOnCancelled, cb),
    onWindowInit: (cb: (payload: PickerWindowInitPayload) => void) =>
      on<PickerWindowInitPayload>(IpcChannels.PickerWindowInit, cb),
    requestInit: (): Promise<PickerWindowInitPayload | null> =>
      ipcRenderer.invoke(IpcChannels.PickerRequestInit),
  },

  clipboard: {
    writeText: (text: string) => ipcRenderer.send(IpcChannels.ClipboardWriteText, text),
  },

  store: {
    get: <K extends StoreKey>(key: K): Promise<StoreSchema[K]> =>
      ipcRenderer.invoke(IpcChannels.StoreGet, key),
    set: <K extends StoreKey>(key: K, value: StoreSchema[K]): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.StoreSet, key, value),
    onChanged: <K extends StoreKey>(cb: (payload: { key: K; value: StoreSchema[K] }) => void) =>
      on<{ key: K; value: StoreSchema[K] }>(IpcChannels.StoreOnChanged, cb),
  },

  shortcut: {
    update: (accelerator: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.ShortcutUpdate, accelerator),
  },

  autostart: {
    get: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.AutostartGet),
    set: (enabled: boolean): Promise<boolean> => ipcRenderer.invoke(IpcChannels.AutostartSet, enabled),
  },

  export: {
    saveFile: (payload: {
      defaultName: string;
      content: string;
      filters: { name: string; extensions: string[] }[];
    }): Promise<{ success: boolean; filePath?: string }> =>
      ipcRenderer.invoke(IpcChannels.ExportSaveFile, payload),
    savePng: (payload: {
      defaultName: string;
      dataUrl: string;
    }): Promise<{ success: boolean; filePath?: string }> =>
      ipcRenderer.invoke(IpcChannels.ExportSavePng, payload),
  },

  app: {
    quit: () => ipcRenderer.send(IpcChannels.AppQuit),
    getVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannels.AppGetVersion),
  },

  updater: {
    check: (): Promise<UpdateCheckResult> => ipcRenderer.invoke(IpcChannels.UpdaterCheck),
    download: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.UpdaterDownload),
    install: (): Promise<void> => ipcRenderer.invoke(IpcChannels.UpdaterInstall),
    dismiss: (version: string) => ipcRenderer.send(IpcChannels.UpdaterDismiss, version),
    openRelease: () => ipcRenderer.send(IpcChannels.UpdaterOpenRelease),
    onAvailable: (cb: (info: UpdateInfo) => void) =>
      on<UpdateInfo>(IpcChannels.UpdaterOnAvailable, cb),
    onProgress: (cb: (progress: UpdateProgress) => void) =>
      on<UpdateProgress>(IpcChannels.UpdaterOnProgress, cb),
    onReady: (cb: (payload: UpdateReadyPayload) => void) =>
      on<UpdateReadyPayload>(IpcChannels.UpdaterOnReady, cb),
    onError: (cb: (payload: UpdateErrorPayload) => void) =>
      on<UpdateErrorPayload>(IpcChannels.UpdaterOnError, cb),
  },

  audio: {
    readConfig: (): Promise<string> => ipcRenderer.invoke(IpcChannels.AudioReadConfig),
    writeConfig: (content: string): Promise<boolean> => ipcRenderer.invoke(IpcChannels.AudioWriteConfig, content),
    getAudioDevices: (): Promise<{ name: string; isInstalled: boolean }[]> => ipcRenderer.invoke(IpcChannels.AudioGetDevices),
    getDevices: (): Promise<string[]> =>
      ipcRenderer.invoke(IpcChannels.AudioGetDevices).then((devs: any) =>
        Array.isArray(devs) ? devs.map((d) => (typeof d === "string" ? d : d.name || "Périphérique")) : []
      ).catch(() => []),
    openDeviceSelector: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.AudioOpenDeviceSelector),
    checkApoInstalled: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.AudioCheckApoInstalled),
    getApoPath: (): Promise<string> => ipcRenderer.invoke(IpcChannels.AudioGetApoPath),
  },

  overlay: {
    show: (payload: any) => ipcRenderer.send(IpcChannels.OverlayShow, payload),
    showHud: (hud: any): Promise<boolean> => ipcRenderer.invoke(IpcChannels.MixerShowHud, hud),
    onData: (cb: (payload: any) => void) => on<any>(IpcChannels.OverlayOnData, cb),
    requestInit: (): Promise<any> => ipcRenderer.invoke(IpcChannels.OverlayRequestInit),
  },

  mixer: {
    getSessions: (): Promise<any[]> =>
      ipcRenderer.invoke(IpcChannels.MixerGetSessions),
    getPeaks: (): Promise<Record<string, number>> =>
      ipcRenderer.invoke(IpcChannels.MixerGetPeaks),
    setProcessVolume: (processName: string, volume: number): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerSetProcessVolume, { processName, volume }),
    setProcessMute: (processName: string, isMuted: boolean): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerSetProcessMute, { processName, isMuted }),
    setMasterVolume: (volume: number): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerSetMasterVolume, volume),
    setMasterMute: (isMuted: boolean): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerSetMasterMute, isMuted),
    resetVolumes: (): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerResetVolumes),
    showHud: (hud: any): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.MixerShowHud, hud),
    registerShortcuts: (bindings: any[]) =>
      ipcRenderer.invoke(IpcChannels.MixerRegisterShortcuts, bindings),
    unregisterShortcuts: () =>
      ipcRenderer.invoke(IpcChannels.MixerUnregisterShortcuts),
    syncState: (states: any[]) =>
      ipcRenderer.invoke(IpcChannels.MixerSyncState, states),
    onShortcutAction: (cb: (payload: any) => void) =>
      on<any>(IpcChannels.MixerOnShortcutAction, cb),
    onStateUpdated: (cb: (payload: any) => void) =>
      on<any>(IpcChannels.MixerOnStateUpdated, cb),
  },

  clips: {
    getFiles: (): Promise<any[]> =>
      ipcRenderer.invoke(IpcChannels.ClipsGetFiles),
    getDesktopSources: (): Promise<any[]> =>
      ipcRenderer.invoke(IpcChannels.ClipsGetDesktopSources),
    saveReplay: (durationSeconds?: number): Promise<any> =>
      ipcRenderer.invoke(IpcChannels.ClipsSaveReplay, durationSeconds),
    saveVideoBlob: (payload: { buffer: ArrayBuffer; filename?: string; durationSeconds?: number }): Promise<any> =>
      ipcRenderer.invoke(IpcChannels.ClipsSaveVideoBlob, payload),
    takeScreenshot: (): Promise<any> =>
      ipcRenderer.invoke(IpcChannels.ClipsTakeScreenshot),
    openFolder: (): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.ClipsOpenFolder),
    deleteFile: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.ClipsDeleteFile, filePath),
    registerShortcuts: (settings: any): Promise<boolean> =>
      ipcRenderer.invoke(IpcChannels.ClipsRegisterShortcuts, settings),
    onReplayTriggered: (cb: () => void) =>
      on<void>(IpcChannels.ClipsOnReplayTriggered, cb),
    onScreenshotTriggered: (cb: () => void) =>
      on<void>(IpcChannels.ClipsOnScreenshotTriggered, cb),
  },
};

contextBridge.exposeInMainWorld("serenity", SerenityApi);
