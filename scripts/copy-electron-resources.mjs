import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destResources = join(root, "dist-electron", "electron", "resources");
const destElectron = join(root, "dist-electron", "electron");

mkdirSync(destResources, { recursive: true });
if (existsSync(join(root, "electron", "resources"))) {
  cpSync(join(root, "electron", "resources"), destResources, { recursive: true });
}

if (existsSync(join(root, "electron", "get-devices.ps1"))) {
  cpSync(join(root, "electron", "get-devices.ps1"), join(destElectron, "get-devices.ps1"));
}
