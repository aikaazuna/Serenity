const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.default = async function (context) {
  if (context.electronPlatformName !== "win32") return;

  const appExe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  const altExe = path.join(context.appOutDir, `${context.packager.appInfo.productName}.exe`);
  const targetExe = fs.existsSync(appExe) ? appExe : (fs.existsSync(altExe) ? altExe : null);

  if (!targetExe) {
    console.warn("[after-pack] Target executable not found in", context.appOutDir);
    return;
  }

  const iconPath = path.join(context.packager.projectDir, "build", "icon.ico");
  const rceditPath = path.join(
    process.env.LOCALAPPDATA || "C:\\Users\\rapha\\AppData\\Local",
    "electron-builder",
    "Cache",
    "winCodeSign",
    "winCodeSign-2.6.0",
    "rcedit-x64.exe"
  );

  if (fs.existsSync(iconPath) && fs.existsSync(rceditPath)) {
    console.log(`[after-pack] Setting icon and metadata on ${targetExe}...`);
    try {
      execFileSync(
        rceditPath,
        [
          targetExe,
          "--set-icon",
          iconPath,
          "--set-version-string",
          "FileDescription",
          "Serenity Hub",
          "--set-version-string",
          "ProductName",
          "Serenity Hub",
          "--set-version-string",
          "CompanyName",
          "Serenity Hub",
          "--set-version-string",
          "LegalCopyright",
          "Copyright © 2026 Serenity Hub",
          "--set-version-string",
          "OriginalFilename",
          "Serenity Hub.exe",
        ],
        { stdio: "inherit" }
      );
      console.log("[after-pack] Successfully embedded icon and metadata into executable!");
    } catch (e) {
      console.error("[after-pack] Failed to run rcedit:", e);
    }
  } else {
    console.warn("[after-pack] Missing icon or rcedit-x64.exe", { iconPath, rceditPath });
  }
};
