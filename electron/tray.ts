import { Tray, Menu, nativeImage, app } from "electron";
import { resourcePath } from "./paths.js";
import { showMainWindow } from "./windows/mainWindow.js";
import { startPicker } from "./windows/pickerWindows.js";

let tray: Tray | null = null;

export function createTray(onQuit: () => void): Tray {
  const iconPath = resourcePath("tray-icon-32.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("Serenity Hub");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Ouvrir Serenity Hub",
      click: () => showMainWindow(),
    },
    {
      label: "Lancer la pipette",
      click: () => void startPicker(),
    },
    { type: "separator" },
    {
      label: "Quitter",
      click: () => onQuit(),
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => showMainWindow());
  tray.on("double-click", () => showMainWindow());

  return tray;
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function updateTrayTooltip(text: string): void {
  tray?.setToolTip(text);
}

export function getAppVersion(): string {
  return app.getVersion();
}
