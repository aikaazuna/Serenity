import { hexToRgb } from "./convert";

/** Palette de noms de couleurs CSS étendue (sous-ensemble des 148 couleurs nommées CSS4). */
export const CSS_COLOR_NAMES: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  silver: "#c0c0c0",
  gray: "#808080",
  maroon: "#800000",
  olive: "#808000",
  purple: "#800080",
  teal: "#008080",
  navy: "#000080",
  orange: "#ffa500",
  pink: "#ffc0cb",
  hotpink: "#ff69b4",
  deeppink: "#ff1493",
  coral: "#ff7f50",
  salmon: "#fa8072",
  tomato: "#ff6347",
  orangered: "#ff4500",
  gold: "#ffd700",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  violet: "#ee82ee",
  indigo: "#4b0082",
  turquoise: "#40e0d0",
  aquamarine: "#7fffd4",
  skyblue: "#87ceeb",
  steelblue: "#4682b4",
  royalblue: "#4169e1",
  slateblue: "#6a5acd",
  midnightblue: "#191970",
  forestgreen: "#228b22",
  limegreen: "#32cd32",
  lime: "#00ff00",
  seagreen: "#2e8b57",
  mediumseagreen: "#3cb371",
  darkgreen: "#006400",
  chartreuse: "#7fff00",
  crimson: "#dc143c",
  firebrick: "#b22222",
  darkred: "#8b0000",
  chocolate: "#d2691e",
  sienna: "#a0522d",
  brown: "#a52a2a",
  tan: "#d2b48c",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  snow: "#fffafa",
  linen: "#faf0e6",
  wheat: "#f5deb3",
  plum: "#dda0dd",
  orchid: "#da70d6",
  fuchsia: "#ff00ff",
  mediumpurple: "#9370db",
  darkviolet: "#9400d3",
  darkorchid: "#9932cc",
  darkslategray: "#2f4f4f",
  slategray: "#708090",
  lightslategray: "#778899",
  gainsboro: "#dcdcdc",
  lightgray: "#d3d3d3",
  darkgray: "#a9a9a9",
  dimgray: "#696969",
  charcoal: "#36454f",
  jet: "#343434",
  onyx: "#0f0f0f",
  obsidian: "#0b0b0d",
  cream: "#fffdd0",
  mint: "#98ff98",
  peach: "#ffe5b4",
  lilac: "#c8a2c8",
  amber: "#ffbf00",
  emerald: "#50c878",
  sapphire: "#0f52ba",
  ruby: "#e0115f",
  jade: "#00a86b",
  cobalt: "#0047ab",
  cerulean: "#007ba7",
  periwinkle: "#ccccff",
  mauve: "#e0b0ff",
  burgundy: "#800020",
  rust: "#b7410e",
  mustard: "#ffdb58",
  olivedrab: "#6b8e23",
  slate: "#708090",
  denim: "#1560bd",
  charcoalgray: "#34373b",
};

const namedEntries = Object.entries(CSS_COLOR_NAMES).map(([name, hex]) => ({
  name,
  hex,
  rgb: hexToRgb(hex),
}));

/** Trouve le nom de couleur CSS le plus proche (distance euclidienne dans l'espace RGB). */
export function findClosestColorName(hex: string): { name: string; distance: number } | null {
  let rgb;
  try {
    rgb = hexToRgb(hex);
  } catch {
    return null;
  }

  let best: { name: string; distance: number } | null = null;
  for (const entry of namedEntries) {
    const dr = rgb.r - entry.rgb.r;
    const dg = rgb.g - entry.rgb.g;
    const db = rgb.b - entry.rgb.b;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (!best || distance < best.distance) best = { name: entry.name, distance };
  }
  return best;
}

/** Recherche des noms de couleurs CSS correspondant (partiellement) à une requête texte. */
export function searchColorNames(query: string): { name: string; hex: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return namedEntries
    .filter((entry) => entry.name.includes(q))
    .slice(0, 12)
    .map((entry) => ({ name: entry.name, hex: entry.hex }));
}
