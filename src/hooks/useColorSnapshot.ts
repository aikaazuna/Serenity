import { useMemo } from "react";
import type { ColorSnapshot } from "@shared/types";
import { buildColorSnapshot, isValidHex } from "@/lib/color/convert";
import { findClosestColorName } from "@/lib/color/names";

export function useColorSnapshot(hex: string): ColorSnapshot | null {
  return useMemo(() => {
    if (!isValidHex(hex)) return null;
    const snapshot = buildColorSnapshot(hex);
    const closest = findClosestColorName(snapshot.hex);
    return closest && closest.distance < 40 ? { ...snapshot, name: closest.name } : snapshot;
  }, [hex]);
}
