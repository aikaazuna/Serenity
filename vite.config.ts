import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};

/** Retire crossorigin du HTML de prod : incompatible avec loadFile() / protocole file:// dans Electron. */
function electronHtml(): import("vite").Plugin {
  return {
    name: "electron-html",
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(="(?:anonymous|use-credentials)")?/g, "");
    },
  };
}

// Renderer-only Vite config. Electron main/preload are compiled separately
// with `tsc` (see electron/tsconfig.json) to keep the two worlds fully isolated.
export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react(), electronHtml()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5188,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        picker: path.resolve(__dirname, "picker.html"),
        overlay: path.resolve(__dirname, "overlay.html"),
      },
    },
  },
});
