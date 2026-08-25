import { app, BrowserWindow } from "electron";
import { createMainWindow, showMainWindow } from "./windows/mainWindow.js";
import { createTray, destroyTray } from "./tray.js";
import { registerIpcHandlers } from "./ipc.js";
import { registerPickerShortcut, unregisterAllShortcuts } from "./shortcuts.js";
import { store } from "./store.js";
import { setAutostart } from "./autostart.js";
import { setQuitting } from "./appState.js";
import { initUpdater } from "./updater.js";

app.name = "Serenity Hub";
app.setName("Serenity Hub");
app.setAppUserModelId("com.serenityhub.app");

// Une seule instance de l'application à la fois : les lancements suivants
// se contentent de réveiller la fenêtre existante.
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createMainWindow();
    initUpdater();
    createTray(() => {
      setQuitting(true);
      app.quit();
    });

    const { pickerShortcut, launchAtStartup } = store.get("settings");
    registerPickerShortcut(pickerShortcut);
    setAutostart(launchAtStartup);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
      else showMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    // Sur Windows, le process reste actif en arrière-plan via le tray ;
    // seule une fermeture explicite ("Quitter") termine l'application.
  });

  app.on("before-quit", () => {
    setQuitting(true);
    unregisterAllShortcuts();
    destroyTray();
  });
}

process.on("uncaughtException", (error) => {
  console.error("[main] Exception non interceptée :", error);
});

export {};
