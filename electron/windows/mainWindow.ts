import { BrowserWindow, shell } from "electron";
import {
  isDev,
  MAIN_WINDOW_HEIGHT,
  MAIN_WINDOW_MIN_HEIGHT,
  MAIN_WINDOW_MIN_WIDTH,
  MAIN_WINDOW_WIDTH,
  VITE_DEV_SERVER_URL,
} from "../constants.js";
import { IpcChannels } from "../../shared/types.js";
import { isQuitting } from "../appState.js";
import { preloadScriptPath, distPath, resourcePath } from "../paths.js";
import { store } from "../store.js";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    minWidth: MAIN_WINDOW_MIN_WIDTH,
    minHeight: MAIN_WINDOW_MIN_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    icon: resourcePath("app-icon-256.png"),
    webPreferences: {
      preload: preloadScriptPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  const broadcastWindowState = (target: BrowserWindow) => {
    if (target.isDestroyed()) return;
    target.webContents.send(IpcChannels.WindowOnStateChanged, {
      isMaximized: target.isMaximized(),
      isMinimized: target.isMinimized(),
    });
  };

  win.on("ready-to-show", () => {
    win.show();
    broadcastWindowState(win);
  });

  win.on("maximize", () => broadcastWindowState(win));
  win.on("unmaximize", () => broadcastWindowState(win));
  win.on("minimize", () => broadcastWindowState(win));
  win.on("restore", () => broadcastWindowState(win));

  // Filet de sécurité : si le renderer crashe (GPU, mémoire…), on le recharge
  // automatiquement plutôt que de laisser l'utilisateur face à une fenêtre vide.
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("[main] Le renderer a crashé :", details.reason);
    if (!win.isDestroyed()) {
      if (isDev) void win.loadURL(VITE_DEV_SERVER_URL);
      else void win.loadFile(distPath("index.html"));
    }
  });

  // Fermer la fenêtre masque l'app dans le tray en production plutôt que de quitter le processus,
  // sauf si l'utilisateur a désactivé cette option ou a explicitement demandé "Quitter".
  win.on("close", (event) => {
    if (!isQuitting() && !isDev && store.get("settings").closeToTray) {
      event.preventDefault();
      win.hide();
    }
  });

  // Toute navigation externe s'ouvre dans le navigateur système, jamais dans l'app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(VITE_DEV_SERVER_URL) && !url.startsWith("file://")) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (isDev) {
    void win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(distPath("index.html"));
  }

  mainWindow = win;
  win.on("closed", () => {
    mainWindow = null;
  });

  return win;
}

export function showMainWindow(): void {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}
