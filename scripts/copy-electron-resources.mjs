import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destResources = join(root, "dist-electron", "electron", "resources");
const destElectron = join(root, "dist-electron", "electron");
const electronResources = join(root, "electron", "resources");

mkdirSync(destResources, { recursive: true });
mkdirSync(electronResources, { recursive: true });

// Compile native C# audio-mixer.exe using csc.exe if source exists
const csFile = join(electronResources, "audio-mixer.cs");
const exeFile = join(electronResources, "audio-mixer.exe");
if (existsSync(csFile)) {
  try {
    const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
    execSync(`"${cscPath}" /nologo /target:exe /optimize+ /platform:anycpu /out:"${exeFile}" "${csFile}"`, { stdio: "ignore" });
  } catch (err) {
    console.warn("Notice: csc compilation skipped or failed:", err);
  }
}

if (existsSync(electronResources)) {
  cpSync(electronResources, destResources, { recursive: true });
}

if (existsSync(join(root, "electron", "get-devices.ps1"))) {
  cpSync(join(root, "electron", "get-devices.ps1"), join(destElectron, "get-devices.ps1"));
}
