import type { StoreKey, StoreSchema } from "@shared/types";
import { DEFAULT_SETTINGS } from "@shared/types";
import { isElectron } from "./utils";

const FALLBACK_DEFAULTS: StoreSchema = {
  settings: DEFAULT_SETTINGS,
  history: [],
  favorites: [],
  collections: [{ id: "default", name: "Favoris", createdAt: Date.now() }],
  update: {},
};

const LOCAL_KEY_PREFIX = "colorflow:";

/**
 * Petite couche d'abstraction au-dessus du stockage : utilise l'IPC Electron sécurisé en
 * production, et retombe sur `localStorage` lorsque l'UI est ouverte hors d'Electron
 * (ex. `vite dev` seul dans un navigateur, pour itérer plus vite sur le design).
 */
export async function getStoreValue<K extends StoreKey>(key: K): Promise<StoreSchema[K]> {
  if (isElectron()) return window.colorflow.store.get(key);

  const raw = localStorage.getItem(LOCAL_KEY_PREFIX + key);
  if (!raw) return FALLBACK_DEFAULTS[key];
  try {
    return JSON.parse(raw) as StoreSchema[K];
  } catch {
    return FALLBACK_DEFAULTS[key];
  }
}

export async function setStoreValue<K extends StoreKey>(
  key: K,
  value: StoreSchema[K],
): Promise<void> {
  if (isElectron()) {
    await window.colorflow.store.set(key, value);
    return;
  }
  localStorage.setItem(LOCAL_KEY_PREFIX + key, JSON.stringify(value));
}
