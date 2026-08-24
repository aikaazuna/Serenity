import Store from "electron-store";
import { DEFAULT_SETTINGS, type StoreSchema } from "../shared/types.js";

/**
 * Unique instance de stockage local persistant (JSON chiffré sur disque via electron-store).
 * Toutes les lectures/écritures passent obligatoirement par les handlers IPC du main process :
 * le renderer n'a jamais d'accès direct au système de fichiers.
 */
export const store = new Store<StoreSchema>({
  name: "colorflow-data",
  defaults: {
    settings: DEFAULT_SETTINGS,
    history: [],
    favorites: [],
    collections: [
      {
        id: "default",
        name: "Favoris",
        createdAt: Date.now(),
      },
    ],
    update: {},
  },
  clearInvalidConfig: true,
});

export type { StoreSchema };
