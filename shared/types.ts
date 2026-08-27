/**
 * Types partagés entre le processus principal Electron et le renderer React.
 * Aucune dépendance Node.js ici : ce fichier est importé des deux côtés.
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-1
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

export interface CMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

export interface OKLCH {
  l: number; // 0-1
  c: number; // 0-~0.4
  h: number; // 0-360
}

/** Représentation canonique et complète d'une couleur, calculée une fois puis mise en cache. */
export interface ColorSnapshot {
  hex: string;
  rgb: RGB;
  rgba: RGBA;
  hsl: HSL;
  hsv: HSV;
  cmyk: CMYK;
  lab: LAB;
  oklch: OKLCH;
  name?: string;
}

export type PaletteHarmony =
  | "monochrome"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic";

export interface GeneratedPalette {
  id: string;
  harmony: PaletteHarmony;
  baseHex: string;
  colors: string[];
}

export interface HistoryEntry {
  id: string;
  hex: string;
  createdAt: number;
  source: "picker" | "manual" | "palette";
}

export interface FavoriteColor {
  id: string;
  hex: string;
  name?: string;
  collectionId: string;
  createdAt: number;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  createdAt: number;
}

export type ThemeMode = "dark" | "light" | "system";

export type DefaultCopyFormat =
  | "hex"
  | "rgb"
  | "rgba"
  | "hsl"
  | "hsv"
  | "cmyk"
  | "lab"
  | "oklch";

export type AppLanguage = "fr" | "en";

export interface AppSettings {
  pickerShortcut: string;
  launchAtStartup: boolean;
  theme: ThemeMode;
  animationsEnabled: boolean;
  defaultCopyFormat: DefaultCopyFormat;
  language: AppLanguage;
  closeToTray: boolean;
  magnifierZoom: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  pickerShortcut: "CommandOrControl+Shift+C",
  launchAtStartup: false,
  theme: "dark",
  animationsEnabled: true,
  defaultCopyFormat: "hex",
  language: "fr",
  closeToTray: true,
  magnifierZoom: 8,
};

export interface PickerCapturedPayload {
  hex: string;
  display: {
    x: number;
    y: number;
  };
}

export interface DisplayCaptureSource {
  displayId: number;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  dataUrl: string;
  imageWidth: number;
  imageHeight: number;
}

export interface PickerWindowInitPayload {
  source: DisplayCaptureSource;
  isPrimary: boolean;
  magnifierZoom: number;
}

export interface PickerHoverPayload {
  hex: string;
}

export interface WindowStatePayload {
  isMaximized: boolean;
  isMinimized: boolean;
}

export interface UpdateStoreState {
  dismissedVersion?: string;
  lastCheckAt?: number;
}

export type UpdatePhase = "idle" | "checking" | "connecting" | "downloading" | "ready" | "error";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  downloadUrl: string;
  assetName: string;
  assetSize: number;
  isPortable: boolean;
}

export interface UpdateProgress {
  phase: UpdatePhase;
  percent: number;
  message: string;
  version?: string;
  bytesReceived?: number;
  totalBytes?: number;
}

export interface UpdateReadyPayload {
  filePath: string;
  version: string;
  isPortable: boolean;
}

export interface UpdateErrorPayload {
  message: string;
}

export type UpdateCheckResult =
  | { status: "available"; info: UpdateInfo }
  | { status: "upToDate" }
  | { status: "error"; message: string };

/** Canaux IPC exposés par le preload — une seule source de vérité pour éviter les typos. */
export const IpcChannels = {
  // Fenêtre
  WindowMinimize: "window:minimize",
  WindowClose: "window:close",
  WindowToggleMaximize: "window:toggle-maximize",
  WindowGetState: "window:get-state",
  WindowOnStateChanged: "window:on-state-changed",

  // Pipette
  PickerStart: "picker:start",
  PickerCancel: "picker:cancel",
  PickerConfirm: "picker:confirm",
  PickerHover: "picker:hover",
  PickerWindowInit: "picker:window-init",
  PickerRequestInit: "picker:request-init",
  PickerOnOpen: "picker:on-open",
  PickerOnCaptured: "picker:on-captured",
  PickerOnCancelled: "picker:on-cancelled",

  // Presse-papiers
  ClipboardWriteText: "clipboard:write-text",

  // Stockage (settings / historique / favoris)
  StoreGet: "store:get",
  StoreSet: "store:set",
  StoreOnChanged: "store:on-changed",

  // Raccourci global
  ShortcutUpdate: "shortcut:update",

  // Démarrage automatique
  AutostartSet: "autostart:set",
  AutostartGet: "autostart:get",

  // Export fichiers
  ExportSaveFile: "export:save-file",
  ExportSavePng: "export:save-png",

  // Tray / cycle de vie
  AppQuit: "app:quit",
  AppGetVersion: "app:get-version",

  // Mises à jour
  UpdaterCheck: "updater:check",
  UpdaterDownload: "updater:download",
  UpdaterInstall: "updater:install",
  UpdaterDismiss: "updater:dismiss",
  UpdaterOpenRelease: "updater:open-release",
  UpdaterOnAvailable: "updater:on-available",
  UpdaterOnProgress: "updater:on-progress",
  UpdaterOnReady: "updater:on-ready",
  UpdaterOnError: "updater:on-error",

  // Audio
  AudioReadConfig: "audio:read-config",
  AudioWriteConfig: "audio:write-config",
  AudioGetDevices: "audio:get-devices",
  AudioCheckApoInstalled: "audio:check-apo",
  AudioGetApoPath: "audio:get-apo-path",

  // Overlay Global Système (Volume / Clips)
  OverlayShow: "overlay:show",
  OverlayOnData: "overlay:on-data",
  OverlayRequestInit: "overlay:request-init",

  // Mixer Global Shortcuts & Actions
  MixerRegisterShortcuts: "mixer:register-shortcuts",
  MixerOnShortcutAction: "mixer:on-shortcut-action",

  // Mixer Audio Sessions & WASAPI Routing
  MixerGetSessions: "mixer:get-sessions",
  MixerGetPeaks: "mixer:get-peaks",
  MixerSetProcessVolume: "mixer:set-process-volume",
  MixerSetProcessMute: "mixer:set-process-mute",
  MixerSetMasterVolume: "mixer:set-master-volume",
  MixerSetMasterMute: "mixer:set-master-mute",
} as const;

export interface WindowsAudioSession {
  pid: number;
  processName: string;
  volume: number;
  isMuted: boolean;
}

export interface MixerGlobalShortcutBinding {
  channelId: string;
  channelName: string;
  channelColor: string;
  target: "headphone" | "stream";
  action: "volUp" | "volDown" | "mute";
  accelerator: string;
}

export interface OverlayNotificationItem {
  id: string;
  channelId?: string;
  channelName: string;
  channelColor: string;
  channelIcon?: string;
  target: "headphone" | "stream";
  volume: number;
  isMuted: boolean;
  actionType: "up" | "down" | "mute" | "set";
}

export interface OverlayNotificationPayload {
  type: "volume" | "clip" | "info";
  title?: string;
  subtitle?: string;
  clipDurationSeconds?: number;
  items: OverlayNotificationItem[];
}

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export interface StoreSchema {
  settings: AppSettings;
  history: HistoryEntry[];
  favorites: FavoriteColor[];
  collections: FavoriteCollection[];
  update: UpdateStoreState;
}

export type StoreKey = keyof StoreSchema;
