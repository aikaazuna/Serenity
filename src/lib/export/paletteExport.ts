import type { GeneratedPalette } from "@shared/types";
import { HARMONY_LABELS } from "@/lib/color/palette";

export function exportPaletteAsJson(palette: GeneratedPalette): string {
  return JSON.stringify(
    {
      harmony: palette.harmony,
      baseColor: palette.baseHex,
      colors: palette.colors,
    },
    null,
    2,
  );
}

export function exportPaletteAsCssVars(palette: GeneratedPalette): string {
  const lines = palette.colors.map((hex, i) => `  --color-${palette.harmony}-${i + 1}: ${hex};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function exportPaletteAsScss(palette: GeneratedPalette): string {
  return palette.colors.map((hex, i) => `$color-${palette.harmony}-${i + 1}: ${hex};`).join("\n");
}

export function exportPaletteAsTailwind(palette: GeneratedPalette): string {
  const entries = palette.colors.map((hex, i) => `    ${i + 1}00: '${hex}',`).join("\n");
  return `// ${HARMONY_LABELS[palette.harmony]}\ncolors: {\n  ${palette.harmony}: {\n${entries}\n  },\n},`;
}

/** Génère un aperçu PNG horizontal de la palette (bandes de couleur + libellé). */
export async function renderPaletteToPngDataUrl(palette: GeneratedPalette): Promise<string> {
  const width = 960;
  const swatchHeight = 220;
  const labelHeight = 64;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = swatchHeight + labelHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de créer le contexte canvas");

  ctx.fillStyle = "#0a0a0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const swatchWidth = width / palette.colors.length;
  palette.colors.forEach((hex, i) => {
    ctx.fillStyle = hex;
    ctx.fillRect(i * swatchWidth, 0, swatchWidth, swatchHeight);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText(HARMONY_LABELS[palette.harmony], 24, swatchHeight + 34);

  ctx.font = "13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText(palette.colors.map((c) => c.toUpperCase()).join("   "), 24, swatchHeight + 54);

  return canvas.toDataURL("image/png");
}
