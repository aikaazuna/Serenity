import { BrowserWindow, screen } from "electron";
import { isDev, VITE_DEV_SERVER_URL } from "../constants.js";
import { preloadScriptPath, distPath } from "../paths.js";
import { store } from "../store.js";
import {
  DEFAULT_SETTINGS,
  IpcChannels,
  type AppSettings,
  type OverlayNotificationPayload,
} from "../../shared/types.js";

let overlayWindow: BrowserWindow | null = null;
let lastPayload: OverlayNotificationPayload | null = null;
let hideTimer: NodeJS.Timeout | null = null;

export function getOverlayWindow(): BrowserWindow | null {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow;
  return null;
}

export function createOverlayWindow(): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) return overlayWindow;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, x: screenX, y: screenY } = primaryDisplay.workArea;

  const winWidth = 360;
  const winHeight = 120;
  const posX = Math.round(screenX + screenWidth - winWidth - 16);
  const posY = Math.round(screenY + 16);

  overlayWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    show: false,
    resizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: preloadScriptPath(),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setMenuBarVisibility(false);
  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.setHasShadow(false);

  if (isDev && VITE_DEV_SERVER_URL) {
    void overlayWindow.loadURL(`${VITE_DEV_SERVER_URL}/overlay.html`);
  } else {
    void overlayWindow.loadFile(distPath("overlay.html"));
  }

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

export function showOverlayNotification(payload: OverlayNotificationPayload): void {
  // Merge current settings from store to ensure defaults if not yet persisted
  const rawSettings = store.get("settings") as Partial<AppSettings> | undefined;
  const activeSettings = {
    ...DEFAULT_SETTINGS.overlay,
    ...(rawSettings?.overlay || {}),
    ...(payload.settings || {}),
  };

  // Respect user preferences
  if (activeSettings.enabled === false) return;
  if (payload.type === "clip" && activeSettings.showReplayAlerts === false) return;
  if (payload.type === "mic" && activeSettings.showMicAlerts === false) return;

  const finalPayload: OverlayNotificationPayload = {
    ...payload,
    settings: activeSettings,
  };

  lastPayload = finalPayload;
  let win = getOverlayWindow();
  if (!win) {
    win = createOverlayWindow();
  }

  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, x: screenX, y: screenY } = primaryDisplay.workArea;
  const isMulti = Boolean(finalPayload.items && finalPayload.items.length > 1);
  const winWidth = 360;
  const winHeight = isMulti ? 240 : 120;
  const posX = Math.round(screenX + screenWidth - winWidth - 16);
  const posY = Math.round(screenY + 16);

  win.setBounds({ x: posX, y: posY, width: winWidth, height: winHeight });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true);

  const sendData = () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IpcChannels.OverlayOnData, finalPayload);
    }
  };

  if (win.webContents.isLoading()) {
    win.webContents.once("did-finish-load", sendData);
  } else {
    sendData();
  }

  if (!win.isVisible()) {
    win.showInactive();
  }
  win.moveTop();

  // Auto-hide window after duration + buffer for exit animation
  const durationMs = Math.max(1000, Math.round(activeSettings.durationSeconds * 1000));
  hideTimer = setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  }, durationMs + 350);
}

export function getOverlayInitPayload(): OverlayNotificationPayload | null {
  return lastPayload;
}
