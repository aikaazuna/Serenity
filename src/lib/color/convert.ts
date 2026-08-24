import Color from "colorjs.io";
import type { CMYK, HSL, HSV, LAB, OKLCH, RGB, RGBA, ColorSnapshot } from "@shared/types";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

/** Normalise n'importe quelle entrée hexadécimale valide vers `#rrggbb` en minuscules. */
export function normalizeHex(value: string): string {
  const trimmed = value.trim().replace(/^#/, "");
  if (!/^[0-9a-f]{3,8}$/i.test(trimmed)) {
    throw new Error(`Valeur hexadécimale invalide : "${value}"`);
  }

  let hex = trimmed.toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  } else if (hex.length === 8) {
    hex = hex.slice(0, 6);
  }

  if (hex.length !== 6) throw new Error(`Valeur hexadécimale invalide : "${value}"`);
  return `#${hex}`;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToRgba(rgb: RGB, a = 1): RGBA {
  return { ...rgb, a: clamp(a, 0, 1) };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h: round(h, 1), s: round(s * 100, 1), v: round(v * 100, 1) };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);

  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

  const c = (1 - rn - k) / (1 - k);
  const m = (1 - gn - k) / (1 - k);
  const y = (1 - bn - k) / (1 - k);

  return { c: round(c * 100, 1), m: round(m * 100, 1), y: round(y * 100, 1), k: round(k * 100, 1) };
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cn = c / 100;
  const mn = m / 100;
  const yn = y / 100;
  const kn = k / 100;

  return {
    r: Math.round(255 * (1 - cn) * (1 - kn)),
    g: Math.round(255 * (1 - mn) * (1 - kn)),
    b: Math.round(255 * (1 - yn) * (1 - kn)),
  };
}

export function rgbToLab({ r, g, b }: RGB): LAB {
  const color = new Color("srgb", [r / 255, g / 255, b / 255]);
  const [l, a, bComp] = color.to("lab").coords;
  return { l: round(l, 1), a: round(a, 1), b: round(bComp, 1) };
}

export function rgbToOklch({ r, g, b }: RGB): OKLCH {
  const color = new Color("srgb", [r / 255, g / 255, b / 255]);
  const [l, c, h] = color.to("oklch").coords;
  return { l: round(l, 3), c: round(c, 3), h: round(Number.isNaN(h) ? 0 : h, 1) };
}

/** Calcule une fois toutes les représentations d'une couleur à partir de son HEX. */
export function buildColorSnapshot(hex: string): ColorSnapshot {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);

  return {
    hex: normalized,
    rgb,
    rgba: rgbToRgba(rgb, 1),
    hsl: rgbToHsl(rgb),
    hsv: rgbToHsv(rgb),
    cmyk: rgbToCmyk(rgb),
    lab: rgbToLab(rgb),
    oklch: rgbToOklch(rgb),
  };
}

/** Luminance relative (WCAG) d'une couleur RGB, utilisée pour le contraste et le "texte recommandé". */
export function relativeLuminance({ r, g, b }: RGB): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
