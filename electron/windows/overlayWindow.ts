import { BrowserWindow, screen } from "electron";
import { isDev, VITE_DEV_SERVER_URL } from "../constants.js";
import { preloadScriptPath, distPath } from "../paths.js";
import { IpcChannels, type OverlayNotificationPayload } from "../../shared/types.js";

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

  const winWidth = 380;
  const winHeight = 320;
  const posX = Math.round(screenX + screenWidth - winWidth - 24);
  const posY = Math.round(screenY + 24);

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
  overlayWindow.setIgnoreMouseEvents(true);

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
  lastPayload = payload;
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
  const winWidth = 360;
  const winHeight = 260;
  const posX = Math.round(screenX + screenWidth - winWidth - 16);
  const posY = Math.round(screenY + 16);

  win.setBounds({ x: posX, y: posY, width: winWidth, height: winHeight });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setIgnoreMouseEvents(true);
  win.moveTop();

  const sendData = () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send(IpcChannels.OverlayOnData, payload);
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

  hideTimer = setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
  }, 3000);
}

export function getOverlayInitPayload(): OverlayNotificationPayload | null {
  return lastPayload;
}
