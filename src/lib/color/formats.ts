import type { ColorSnapshot, DefaultCopyFormat } from "@shared/types";

export interface ColorFormatDefinition {
  id: string;
  label: string;
  value: string;
}

/** Formats "couleur" principaux affichés dans le panneau de détail. */
export function getPrimaryFormats(color: ColorSnapshot): ColorFormatDefinition[] {
  const { hex, rgb, rgba, hsl, hsv, cmyk, lab, oklch } = color;
  return [
    { id: "hex", label: "HEX", value: hex.toUpperCase() },
    { id: "rgb", label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
    { id: "rgba", label: "RGBA", value: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})` },
    { id: "hsl", label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
    { id: "hsv", label: "HSV", value: `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)` },
    { id: "cmyk", label: "CMYK", value: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)` },
    { id: "lab", label: "LAB", value: `lab(${lab.l}% ${lab.a} ${lab.b})` },
    { id: "oklch", label: "OKLCH", value: `oklch(${oklch.l} ${oklch.c} ${oklch.h})` },
  ];
}

/** Snippets prêts à copier pour les frameworks/langages les plus utilisés. */
export function getDeveloperFormats(color: ColorSnapshot): ColorFormatDefinition[] {
  const { hex, rgb, rgba } = color;
  const hexUpper = hex.toUpperCase();
  const hexNoHash = hexUpper.slice(1);
  const toHex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
  const rgbFloat = {
    r: (rgb.r / 255).toFixed(3),
    g: (rgb.g / 255).toFixed(3),
    b: (rgb.b / 255).toFixed(3),
  };

  return [
    { id: "css", label: "CSS", value: `color: ${hex};` },
    { id: "css-var", label: "CSS Variable", value: `--primary-color: ${hex};` },
    {
      id: "tailwind",
      label: "Tailwind Config",
      value: `colors: {\n  primary: '${hex}',\n},`,
    },
    {
      id: "flutter",
      label: "Flutter",
      value: `Color(0xFF${toHex2(rgb.r)}${toHex2(rgb.g)}${toHex2(rgb.b)})`,
    },
    {
      id: "swiftui",
      label: "SwiftUI",
      value: `Color(red: ${rgbFloat.r}, green: ${rgbFloat.g}, blue: ${rgbFloat.b})`,
    },
    { id: "android-xml", label: "Android XML", value: `#FF${hexNoHash}` },
    { id: "scss", label: "SCSS", value: `$primary-color: ${hex};` },
    {
      id: "rgba-css",
      label: "CSS rgba()",
      value: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
    },
  ];
}

/** Valeur textuelle d'un format pour la copie rapide (réglage defaultCopyFormat). */
export function formatColorValue(color: ColorSnapshot, format: DefaultCopyFormat): string {
  const match = getPrimaryFormats(color).find((f) => f.id === format);
  return match?.value ?? color.hex.toUpperCase();
}
