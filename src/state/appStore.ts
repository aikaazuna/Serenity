import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  AppSettings,
  FavoriteColor,
  FavoriteCollection,
  HistoryEntry,
} from "@shared/types";
import { DEFAULT_SETTINGS } from "@shared/types";
import { getStoreValue, setStoreValue } from "@/lib/persistence";
import { normalizeHex } from "@/lib/color/convert";

export type NotificationTone = "success" | "info" | "warning";

export interface NotificationItem {
  id: string;
  message: string;
  description?: string;
  tone: NotificationTone;
  createdAt: number;
}

interface AppState {
  isHydrated: boolean;
  settings: AppSettings;
  history: HistoryEntry[];
  favorites: FavoriteColor[];
  collections: FavoriteCollection[];
  activeColorHex: string;
  notifications: NotificationItem[];
  captureFlash: { hex: string; token: string } | null;
  isPickerActive: boolean;

  hydrate: () => Promise<void>;
  setActiveColor: (hex: string, source?: HistoryEntry["source"]) => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;

  addHistoryEntry: (hex: string, source?: HistoryEntry["source"]) => void;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;

  addFavorite: (hex: string, collectionId?: string, name?: string) => void;
  removeFavorite: (id: string) => void;
  renameFavorite: (id: string, name: string) => void;
  isFavorite: (hex: string) => boolean;

  addCollection: (name: string) => FavoriteCollection;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;

  notify: (message: string, tone?: NotificationTone, description?: string) => void;
  dismissNotification: (id: string) => void;

  setPickerActive: (active: boolean) => void;
  triggerCaptureFlash: (hex: string) => void;
  clearCaptureFlash: () => void;
}

const HISTORY_LIMIT = 500;

export const useAppStore = create<AppState>((set, get) => ({
  isHydrated: false,
  settings: DEFAULT_SETTINGS,
  history: [],
  favorites: [],
  collections: [],
  activeColorHex: "#6366f1",
  notifications: [],
  captureFlash: null,
  isPickerActive: false,

  hydrate: async () => {
    const [settings, history, favorites, collections] = await Promise.all([
      getStoreValue("settings"),
      getStoreValue("history"),
      getStoreValue("favorites"),
      getStoreValue("collections"),
    ]);
    set({ settings, history, favorites, collections, isHydrated: true });
  },

  setActiveColor: (hex, source) => {
    try {
      const normalized = normalizeHex(hex);
      set({ activeColorHex: normalized });
      if (source) get().addHistoryEntry(normalized, source);
    } catch {
      // Ignore une entrée invalide plutôt que de casser l'UI.
    }
  },

  updateSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    await setStoreValue("settings", next);
  },

  addHistoryEntry: (hex, source = "manual") => {
    const normalized = normalizeHex(hex);
    const existing = get().history;
    const withoutDuplicate = existing.filter((entry) => entry.hex !== normalized);
    const entry: HistoryEntry = { id: nanoid(10), hex: normalized, createdAt: Date.now(), source };
    const next = [entry, ...withoutDuplicate].slice(0, HISTORY_LIMIT);
    set({ history: next });
    void setStoreValue("history", next);
  },

  removeHistoryEntry: (id) => {
    const next = get().history.filter((entry) => entry.id !== id);
    set({ history: next });
    void setStoreValue("history", next);
  },

  clearHistory: () => {
    set({ history: [] });
    void setStoreValue("history", []);
  },

  addFavorite: (hex, collectionId = "default", name) => {
    const normalized = normalizeHex(hex);
    if (get().isFavorite(normalized)) return;
    const favorite: FavoriteColor = {
      id: nanoid(10),
      hex: normalized,
      name,
      collectionId,
      createdAt: Date.now(),
    };
    const next = [favorite, ...get().favorites];
    set({ favorites: next });
    void setStoreValue("favorites", next);
  },

  removeFavorite: (id) => {
    const next = get().favorites.filter((fav) => fav.id !== id);
    set({ favorites: next });
    void setStoreValue("favorites", next);
  },

  renameFavorite: (id, name) => {
    const next = get().favorites.map((fav) => (fav.id === id ? { ...fav, name } : fav));
    set({ favorites: next });
    void setStoreValue("favorites", next);
  },

  isFavorite: (hex) => {
    try {
      const normalized = normalizeHex(hex);
      return get().favorites.some((fav) => fav.hex === normalized);
    } catch {
      return false;
    }
  },

  addCollection: (name) => {
    const collection: FavoriteCollection = { id: nanoid(8), name, createdAt: Date.now() };
    const next = [...get().collections, collection];
    set({ collections: next });
    void setStoreValue("collections", next);
    return collection;
  },

  renameCollection: (id, name) => {
    const next = get().collections.map((col) => (col.id === id ? { ...col, name } : col));
    set({ collections: next });
    void setStoreValue("collections", next);
  },

  deleteCollection: (id) => {
    if (id === "default") return;
    const nextCollections = get().collections.filter((col) => col.id !== id);
    const nextFavorites = get().favorites.filter((fav) => fav.collectionId !== id);
    set({ collections: nextCollections, favorites: nextFavorites });
    void setStoreValue("collections", nextCollections);
    void setStoreValue("favorites", nextFavorites);
  },

  notify: (message, tone = "success", description) => {
    const item: NotificationItem = { id: nanoid(8), message, description, tone, createdAt: Date.now() };
    set({ notifications: [...get().notifications, item] });
    setTimeout(() => get().dismissNotification(item.id), 3200);
  },

  dismissNotification: (id) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  setPickerActive: (active) => set({ isPickerActive: active }),

  triggerCaptureFlash: (hex) => {
    const token = nanoid(6);
    set({ captureFlash: { hex, token } });
    setTimeout(() => {
      if (get().captureFlash?.token === token) set({ captureFlash: null });
    }, 1600);
  },

  clearCaptureFlash: () => set({ captureFlash: null }),
}));
