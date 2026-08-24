import { BrowserWindow, desktopCapturer, globalShortcut, nativeImage, screen } from "electron";
import { isDev, VITE_DEV_SERVER_URL } from "../constants.js";
import { preloadScriptPath, distPath } from "../paths.js";
import { IpcChannels, type DisplayCaptureSource, type PickerWindowInitPayload } from "../../shared/types.js";
import { store } from "../store.js";
import { getMainWindow, showMainWindow } from "./mainWindow.js";

let pickerWindows: BrowserWindow[] = [];
let isPickerActive = false;
const pickerInitByWebContentsId = new Map<number, PickerWindowInitPayload>();

const PICKER_CANCEL_ACCELERATOR = "Escape";

export function getPickerInitForWebContents(webContentsId: number): PickerWindowInitPayload | null {
  return pickerInitByWebContentsId.get(webContentsId) ?? null;
}

function registerPickerCancelShortcut(): void {
  if (!globalShortcut.isRegistered(PICKER_CANCEL_ACCELERATOR)) {
    globalShortcut.register(PICKER_CANCEL_ACCELERATOR, () => cancelPicker());
  }
}

function unregisterPickerCancelShortcut(): void {
  if (globalShortcut.isRegistered(PICKER_CANCEL_ACCELERATOR)) {
    globalShortcut.unregister(PICKER_CANCEL_ACCELERATOR);
  }
}

function syncPickerActiveState(): void {
  pickerWindows = pickerWindows.filter((w) => !w.isDestroyed());
  if (pickerWindows.length === 0 && isPickerActive) {
    isPickerActive = false;
    unregisterPickerCancelShortcut();
    getMainWindow()?.webContents.send(IpcChannels.PickerOnCancelled);
  }
}

/**
 * Capture chaque écran connecté à sa résolution physique (bounds * scaleFactor)
 * afin que l'échantillonnage de pixel dans l'overlay soit fidèle à la couleur réelle.
 */
async function captureAllDisplays(): Promise<DisplayCaptureSource[]> {
  const displays = screen.getAllDisplays();
  const maxWidth = Math.max(...displays.map((d) => Math.round(d.bounds.width * d.scaleFactor)));
  const maxHeight = Math.max(...displays.map((d) => Math.round(d.bounds.height * d.scaleFactor)));

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: maxWidth, height: maxHeight },
  });

  return displays.map((display, index) => {
    const source =
      sources.find((s) => s.display_id === String(display.id)) ?? sources[index] ?? sources[0];
    const image = source ? source.thumbnail : nativeImage.createEmpty();
    const size = image.getSize();
    return {
      displayId: display.id,
      bounds: { x: display.bounds.x, y: display.bounds.y, width: display.bounds.width, height: display.bounds.height },
      scaleFactor: display.scaleFactor,
      dataUrl: image.toDataURL(),
      imageWidth: size.width,
      imageHeight: size.height,
    };
  });
}

function createPickerWindow(source: DisplayCaptureSource, isPrimary: boolean): BrowserWindow {
  const win = new BrowserWindow({
    x: source.bounds.x,
    y: source.bounds.y,
    width: source.bounds.width,
    height: source.bounds.height,
    frame: false,
    transparent: false,
    backgroundColor: "#000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: preloadScriptPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setMenuBarVisibility(false);

  const magnifierZoom = store.get("settings").magnifierZoom;
  const initPayload: PickerWindowInitPayload = { source, isPrimary, magnifierZoom };
  const webContentsId = win.webContents.id;
  pickerInitByWebContentsId.set(webContentsId, initPayload);

  if (isDev) {
    void win.loadURL(`${VITE_DEV_SERVER_URL}/picker.html`);
  } else {
    void win.loadFile(distPath("picker.html"));
  }

  win.webContents.once("did-fail-load", (_event, code, description, url) => {
    console.error("[picker] Échec chargement :", code, description, url);
  });

  win.webContents.once("did-finish-load", () => {
    if (win.isDestroyed()) return;
    win.show();
    if (isPrimary) win.focus();
  });

  win.on("closed", () => {
    pickerInitByWebContentsId.delete(webContentsId);
    pickerWindows = pickerWindows.filter((w) => w !== win);
    syncPickerActiveState();
  });

  return win;
}

export async function startPicker(): Promise<void> {
  if (isPickerActive) return;
  isPickerActive = true;

  try {
    const sources = await captureAllDisplays();
    const primaryDisplayId = screen.getPrimaryDisplay().id;

    pickerWindows = sources.map((source) =>
      createPickerWindow(source, source.displayId === primaryDisplayId),
    );

    registerPickerCancelShortcut();
    getMainWindow()?.webContents.send(IpcChannels.PickerOnOpen);
  } catch (error) {
    isPickerActive = false;
    unregisterPickerCancelShortcut();
    console.error("[picker] Impossible de démarrer la capture d'écran :", error);
  }
}

function closeAllPickerWindows(): void {
  for (const win of pickerWindows) {
    if (!win.isDestroyed()) win.close();
  }
  pickerWindows = [];
}

export function cancelPicker(): void {
  if (!isPickerActive) return;
  isPickerActive = false;
  unregisterPickerCancelShortcut();
  closeAllPickerWindows();
  getMainWindow()?.webContents.send(IpcChannels.PickerOnCancelled);
}

export function confirmPicker(hex: string): void {
  if (!isPickerActive) return;
  isPickerActive = false;
  unregisterPickerCancelShortcut();
  closeAllPickerWindows();
  showMainWindow();
  getMainWindow()?.webContents.send(IpcChannels.PickerOnCaptured, { hex });
}

export function isPickerRunning(): boolean {
  return isPickerActive;
}
