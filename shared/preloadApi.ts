/**
 * Contrat de l'API exposée par le preload sur `window.colorflow`.
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
  WindowsAudioSession,
} from "./types.js";

export type Unsubscribe = () => void;

export interface ColorFlowApi {
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
    getAudioDevices: () => Promise<{ name: string; isInstalled: boolean }[]>;
    getDevices: () => Promise<string[]>;
    checkApoInstalled: () => Promise<boolean>;
    getApoPath: () => Promise<string>;
  };
  overlay: {
    show: (payload: OverlayNotificationPayload) => void;
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
    registerShortcuts: (bindings: MixerGlobalShortcutBinding[]) => Promise<boolean>;
    onShortcutAction: (cb: (payload: { channelId: string; target: "headphone" | "stream"; action: "volUp" | "volDown" | "mute" }) => void) => Unsubscribe;
  };
}

export type { AppSettings, OverlayNotificationPayload, OverlayNotificationItem, MixerGlobalShortcutBinding, WindowsAudioSession };
