import type { RGB } from "@shared/types";
import { relativeLuminance } from "./convert";

export interface ContrastResult {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
  recommendedTextColor: "#000000" | "#ffffff";
  contrastWithBlack: number;
  contrastWithWhite: number;
}

/** Ratio de contraste WCAG 2.x entre deux couleurs RGB (1 à 21). */
export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function analyzeContrast(background: RGB): ContrastResult {
  const black: RGB = { r: 0, g: 0, b: 0 };
  const white: RGB = { r: 255, g: 255, b: 255 };

  const contrastWithBlack = contrastRatio(background, black);
  const contrastWithWhite = contrastRatio(background, white);
  const ratio = Math.max(contrastWithBlack, contrastWithWhite);
  const recommendedTextColor: "#000000" | "#ffffff" =
    contrastWithBlack >= contrastWithWhite ? "#000000" : "#ffffff";

  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
    recommendedTextColor,
    contrastWithBlack: Math.round(contrastWithBlack * 100) / 100,
    contrastWithWhite: Math.round(contrastWithWhite * 100) / 100,
  };
}
