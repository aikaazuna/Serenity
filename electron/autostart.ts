import { app } from "electron";

export function setAutostart(enabled: boolean): void {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: ["--hidden"],
  });
}

export function getAutostart(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}
