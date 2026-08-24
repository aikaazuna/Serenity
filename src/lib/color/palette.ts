import type { GeneratedPalette, HSL, PaletteHarmony } from "@shared/types";
import { hexToRgb, hslToRgb, rgbToHex, rgbToHsl } from "./convert";

const wrapHue = (h: number): number => ((h % 360) + 360) % 360;
const clampPct = (v: number): number => Math.min(100, Math.max(0, v));

function toHex(hsl: HSL): string {
  return rgbToHex(hslToRgb({ h: wrapHue(hsl.h), s: clampPct(hsl.s), l: clampPct(hsl.l) }));
}

function monochrome(base: HSL): string[] {
  const lightnesses = [88, 72, 56, base.l, 40, 26, 14];
  return lightnesses.map((l) => toHex({ h: base.h, s: base.s, l }));
}

function analogous(base: HSL): string[] {
  return [-40, -25, -10, 0, 12, 26, 40].map((offset) =>
    toHex({ h: base.h + offset, s: base.s, l: base.l }),
  );
}

function complementary(base: HSL): string[] {
  const comp = base.h + 180;
  return [
    toHex({ h: base.h, s: base.s, l: 82 }),
    toHex({ h: base.h, s: base.s, l: 64 }),
    toHex(base),
    toHex({ h: base.h, s: base.s, l: 32 }),
    toHex({ h: comp, s: base.s, l: 82 }),
    toHex({ h: comp, s: base.s, l: base.l }),
    toHex({ h: comp, s: base.s, l: 32 }),
  ];
}

function splitComplementary(base: HSL): string[] {
  const s1 = base.h + 150;
  const s2 = base.h + 210;
  return [
    toHex({ h: base.h, s: base.s, l: 78 }),
    toHex(base),
    toHex({ h: base.h, s: base.s, l: 30 }),
    toHex({ h: s1, s: base.s, l: base.l }),
    toHex({ h: s1, s: base.s, l: 32 }),
    toHex({ h: s2, s: base.s, l: base.l }),
    toHex({ h: s2, s: base.s, l: 32 }),
  ];
}

function triadic(base: HSL): string[] {
  const t1 = base.h + 120;
  const t2 = base.h + 240;
  return [
    toHex(base),
    toHex({ h: base.h, s: base.s, l: 32 }),
    toHex({ h: t1, s: base.s, l: base.l }),
    toHex({ h: t1, s: base.s, l: 32 }),
    toHex({ h: t2, s: base.s, l: base.l }),
    toHex({ h: t2, s: base.s, l: 32 }),
  ];
}

function tetradic(base: HSL): string[] {
  const t1 = base.h + 90;
  const t2 = base.h + 180;
  const t3 = base.h + 270;
  return [
    toHex(base),
    toHex({ h: t1, s: base.s, l: base.l }),
    toHex({ h: t2, s: base.s, l: base.l }),
    toHex({ h: t3, s: base.s, l: base.l }),
    toHex({ h: base.h, s: base.s, l: 30 }),
    toHex({ h: t2, s: base.s, l: 30 }),
  ];
}

const HARMONY_BUILDERS: Record<PaletteHarmony, (base: HSL) => string[]> = {
  monochrome,
  analogous,
  complementary,
  "split-complementary": splitComplementary,
  triadic,
  tetradic,
};

export const HARMONY_LABELS: Record<PaletteHarmony, string> = {
  monochrome: "Monochrome",
  analogous: "Analogue",
  complementary: "Complémentaire",
  "split-complementary": "Split complémentaire",
  triadic: "Triadique",
  tetradic: "Tétradique",
};

export function generatePalette(baseHex: string, harmony: PaletteHarmony): GeneratedPalette {
  const baseHsl = rgbToHsl(hexToRgb(baseHex));
  const colors = HARMONY_BUILDERS[harmony](baseHsl);
  return { id: harmony, harmony, baseHex, colors };
}

export function generateAllPalettes(baseHex: string): GeneratedPalette[] {
  return (Object.keys(HARMONY_BUILDERS) as PaletteHarmony[]).map((harmony) =>
    generatePalette(baseHex, harmony),
  );
}
