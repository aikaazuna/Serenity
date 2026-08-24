import { build } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [join(root, "electron/preload.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: join(root, "dist-electron/electron/preload.js"),
  external: ["electron"],
});
