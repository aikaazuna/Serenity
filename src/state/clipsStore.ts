import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClipItem } from "@shared/types";
import { replayRecorder } from "@/lib/replay-recorder";

export interface ClipTrack {
  enabled: boolean;
  vol: number;
  label: string;
  color: string;
  key: string;
}

interface ClipsStoreState {
  items: ClipItem[];
  filter: "all" | "video" | "screenshot";
  replayActive: boolean;
  replayDuration: number;
  tracks: Record<string, ClipTrack>;
  selectedClip: ClipItem | null;
  selectedScreenshot: ClipItem | null;
  isLoading: boolean;
  isSavingReplay: boolean;
  isTakingScreenshot: boolean;

  // Actions
  loadFiles: () => Promise<void>;
  takeScreenshot: () => Promise<ClipItem | null>;
  saveReplay: () => Promise<ClipItem | null>;
  saveVideoBlob: (buffer: ArrayBuffer, filename?: string, durationSeconds?: number) => Promise<ClipItem | null>;
  deleteFile: (filePath: string) => Promise<boolean>;
  openFolder: () => Promise<boolean>;
  setFilter: (filter: "all" | "video" | "screenshot") => void;
  setReplayActive: (active: boolean) => void;
  toggleReplayActive: () => void;
  setReplayDuration: (duration: number) => void;
  toggleTrack: (key: string) => void;
  setTrackVol: (key: string, vol: number) => void;
  setSelectedClip: (clip: ClipItem | null) => void;
  setSelectedScreenshot: (item: ClipItem | null) => void;
}

const defaultTracks: Record<string, ClipTrack> = {
  game: { key: "game", enabled: true, vol: 100, label: "Piste Jeu (Audio Système)", color: "#30D158" },
  mic: { key: "mic", enabled: true, vol: 100, label: "Microphone (Voix Joueur)", color: "#FF9F0A" },
  chat: { key: "chat", enabled: true, vol: 90, label: "Chat Vocal (Discord / Teams)", color: "#0A84FF" },
  media: { key: "media", enabled: false, vol: 70, label: "Musique de fond (Spotify)", color: "#BF5AF2" },
};

export const useClipsStore = create<ClipsStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      filter: "all",
      replayActive: true,
      replayDuration: 30,
      tracks: defaultTracks,
      selectedClip: null,
      selectedScreenshot: null,
      isLoading: false,
      isSavingReplay: false,
      isTakingScreenshot: false,

      loadFiles: async () => {
        set({ isLoading: true });
        try {
          if ((window as any).serenity?.clips?.getFiles) {
            const files = await (window as any).serenity.clips.getFiles();
            set({ items: Array.isArray(files) ? files : [] });
          }
        } catch (err) {
          console.error("Failed to load clips:", err);
        } finally {
          set({ isLoading: false });
        }
      },

      takeScreenshot: async () => {
        set({ isTakingScreenshot: true });
        try {
          if ((window as any).serenity?.clips?.takeScreenshot) {
            const item = await (window as any).serenity.clips.takeScreenshot();
            if (item) {
              set((state) => ({
                items: [item, ...state.items.filter((i) => i.id !== item.id)],
              }));
              return item;
            }
          }
          return null;
        } catch (err) {
          console.error("Failed to take screenshot:", err);
          return null;
        } finally {
          set({ isTakingScreenshot: false });
        }
      },

      saveReplay: async () => {
        set({ isSavingReplay: true });
        try {
          const duration = get().replayDuration;
          const item = await replayRecorder.saveReplay(duration);
          if (item) {
            set((state) => ({
              items: [item, ...state.items.filter((i) => i.id !== item.id)],
            }));
            return item;
          }
          return null;
        } catch (err) {
          console.error("Failed to save replay:", err);
          return null;
        } finally {
          set({ isSavingReplay: false });
        }
      },

      saveVideoBlob: async (buffer: ArrayBuffer, filename?: string, durationSeconds?: number) => {
        try {
          if ((window as any).serenity?.clips?.saveVideoBlob) {
            const item = await (window as any).serenity.clips.saveVideoBlob({
              buffer,
              filename,
              durationSeconds: durationSeconds || get().replayDuration,
            });
            if (item) {
              set((state) => ({
                items: [item, ...state.items.filter((i) => i.id !== item.id)],
              }));
              return item;
            }
          }
          return null;
        } catch (err) {
          console.error("Failed to save video blob:", err);
          return null;
        }
      },

      deleteFile: async (filePath: string) => {
        try {
          if ((window as any).serenity?.clips?.deleteFile) {
            const ok = await (window as any).serenity.clips.deleteFile(filePath);
            if (ok) {
              set((state) => ({
                items: state.items.filter((i) => i.path !== filePath),
                selectedClip: state.selectedClip?.path === filePath ? null : state.selectedClip,
                selectedScreenshot: state.selectedScreenshot?.path === filePath ? null : state.selectedScreenshot,
              }));
              return true;
            }
          }
          return false;
        } catch (err) {
          console.error("Failed to delete clip file:", err);
          return false;
        }
      },

      openFolder: async () => {
        try {
          if ((window as any).serenity?.clips?.openFolder) {
            return await (window as any).serenity.clips.openFolder();
          }
          return false;
        } catch (err) {
          console.error("Failed to open clips folder:", err);
          return false;
        }
      },

      setFilter: (filter) => set({ filter }),
      setReplayActive: (replayActive) => {
        set({ replayActive });
        if (replayActive) void replayRecorder.start();
        else replayRecorder.stop();
      },
      toggleReplayActive: () => {
        const next = !get().replayActive;
        set({ replayActive: next });
        if (next) void replayRecorder.start();
        else replayRecorder.stop();
      },
      setReplayDuration: (replayDuration) => set({ replayDuration }),

      toggleTrack: (key) =>
        set((state) => {
          const current = state.tracks[key];
          if (!current) return state;
          return {
            tracks: {
              ...state.tracks,
              [key]: { ...current, enabled: !current.enabled },
            },
          };
        }),

      setTrackVol: (key, vol) =>
        set((state) => {
          const current = state.tracks[key];
          if (!current) return state;
          return {
            tracks: {
              ...state.tracks,
              [key]: { ...current, vol },
            },
          };
        }),

      setSelectedClip: (selectedClip) => set({ selectedClip }),
      setSelectedScreenshot: (selectedScreenshot) => set({ selectedScreenshot }),
    }),
    {
      name: "serenity-clips-storage-v1",
      partialize: (state) => ({
        replayActive: state.replayActive,
        replayDuration: state.replayDuration,
        tracks: state.tracks,
      }),
    }
  )
);
