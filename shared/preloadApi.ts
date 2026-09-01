/**
 * Contrat de l'API exposée par le preload sur `window.serenity`.
 * Défini séparément du preload lui-même afin que le renderer (projet TS distinct)
 * puisse le typer sans jamais importer de code Node/Electron.
 */
import type {
  AppSettings,
  PickerCapturedPayload,
  PickerWindowInitPayload,
  StoreKey,
  StoreSchema,
  UpdateCheckResult,
  UpdateErrorPayload,
  UpdateInfo,
  UpdateProgress,
  UpdateReadyPayload,
  WindowStatePayload,
  OverlayNotificationPayload,
  OverlayNotificationItem,
  MixerGlobalShortcutBinding,
  MixerChannelVolumeState,
  WindowsAudioSession,
  AudioDeviceInfo,
  ClipItem,
  ClipsSettings,
} from "./types.js";

export type Unsubscribe = () => void;

export interface SerenityApi {
  window: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
    getState: () => Promise<WindowStatePayload>;
    onStateChanged: (cb: (payload: WindowStatePayload) => void) => Unsubscribe;
  };
  picker: {
    start: () => Promise<void>;
    cancel: () => void;
    confirm: (hex: string) => void;
    onOpen: (cb: () => void) => Unsubscribe;
    onCaptured: (cb: (payload: PickerCapturedPayload) => void) => Unsubscribe;
    onCancelled: (cb: () => void) => Unsubscribe;
    onWindowInit: (cb: (payload: PickerWindowInitPayload) => void) => Unsubscribe;
    requestInit: () => Promise<PickerWindowInitPayload | null>;
  };
  clipboard: {
    writeText: (text: string) => void;
  };
  store: {
    get: <K extends StoreKey>(key: K) => Promise<StoreSchema[K]>;
    set: <K extends StoreKey>(key: K, value: StoreSchema[K]) => Promise<boolean>;
    onChanged: <K extends StoreKey>(
      cb: (payload: { key: K; value: StoreSchema[K] }) => void,
    ) => Unsubscribe;
  };
  shortcut: {
    update: (accelerator: string) => Promise<boolean>;
  };
  autostart: {
    get: () => Promise<boolean>;
    set: (enabled: boolean) => Promise<boolean>;
  };
  export: {
    saveFile: (payload: {
      defaultName: string;
      content: string;
      filters: { name: string; extensions: string[] }[];
    }) => Promise<{ success: boolean; filePath?: string }>;
    savePng: (payload: {
      defaultName: string;
      dataUrl: string;
    }) => Promise<{ success: boolean; filePath?: string }>;
  };
  app: {
    quit: () => void;
    getVersion: () => Promise<string>;
  };
  updater: {
    check: () => Promise<UpdateCheckResult>;
    download: () => Promise<string | null>;
    install: () => Promise<void>;
    dismiss: (version: string) => void;
    openRelease: () => void;
    onAvailable: (cb: (info: UpdateInfo) => void) => Unsubscribe;
    onProgress: (cb: (progress: UpdateProgress) => void) => Unsubscribe;
    onReady: (cb: (payload: UpdateReadyPayload) => void) => Unsubscribe;
    onError: (cb: (payload: UpdateErrorPayload) => void) => Unsubscribe;
  };
  audio: {
    readConfig: () => Promise<string>;
    writeConfig: (content: string) => Promise<boolean>;
    getAudioDevices: () => Promise<AudioDeviceInfo[]>;
    getDevices: () => Promise<string[]>;
    openDeviceSelector: () => Promise<boolean>;
    checkApoInstalled: () => Promise<boolean>;
    getApoPath: () => Promise<string>;
  };
  overlay: {
    /** Show a full overlay notification payload */
    show: (payload: OverlayNotificationPayload) => void;
    /** Convenience method to show a single HUD item (volume/mute) */
    showHud: (hud: OverlayNotificationItem) => void;
    onData: (cb: (payload: OverlayNotificationPayload) => void) => Unsubscribe;
    requestInit: () => Promise<OverlayNotificationPayload | null>;
  };

  mixer: {
    getSessions: () => Promise<WindowsAudioSession[]>;
    getPeaks: () => Promise<Record<string, number>>;
    setProcessVolume: (processName: string, volume: number) => Promise<boolean>;
    setProcessMute: (processName: string, isMuted: boolean) => Promise<boolean>;
    setMasterVolume: (volume: number) => Promise<boolean>;
    setMasterMute: (isMuted: boolean) => Promise<boolean>;
    resetVolumes: () => Promise<boolean>;
    showHud: (hud: any) => Promise<boolean>;
    registerShortcuts: (bindings: MixerGlobalShortcutBinding[]) => Promise<boolean>;
    unregisterShortcuts: () => Promise<boolean>;
    syncState: (states: MixerChannelVolumeState[]) => Promise<boolean>;
    onShortcutAction: (cb: (payload: { channelId: string; target: "headphone" | "stream"; action: "volUp" | "volDown" | "mute" }) => void) => Unsubscribe;
    onStateUpdated: (cb: (payload: { channelId: string; state: MixerChannelVolumeState }) => void) => Unsubscribe;
  };

  clips: {
    getFiles: () => Promise<ClipItem[]>;
    getDesktopSources: () => Promise<{ id: string; name: string }[]>;
    saveReplay: (durationSeconds?: number) => Promise<ClipItem | null>;
    saveVideoBlob: (payload: { buffer: ArrayBuffer; filename?: string; durationSeconds?: number }) => Promise<ClipItem | null>;
    takeScreenshot: () => Promise<ClipItem | null>;
    openFolder: () => Promise<boolean>;
    deleteFile: (filePath: string) => Promise<boolean>;
    registerShortcuts: (settings: { replayShortcut?: string; screenshotShortcut?: string }) => Promise<boolean>;
    onReplayTriggered: (cb: () => void) => Unsubscribe;
    onScreenshotTriggered: (cb: () => void) => Unsubscribe;
  };
}

export type {
  AppSettings,
  OverlayNotificationPayload,
  OverlayNotificationItem,
  MixerGlobalShortcutBinding,
  MixerChannelVolumeState,
  WindowsAudioSession,
  AudioDeviceInfo,
  ClipItem,
  ClipsSettings,
};
