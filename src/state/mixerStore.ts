import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MixerChannel,
  MixerChannelId,
  MixerState,
  MixerTab,
  MixerApp,
  ChannelShortcuts,
  VolumeHudNotification,
  MixerDspPreset,
} from "@/types/mixer";
import { nanoid } from "nanoid";

interface MixerStore extends MixerState {
  setMixerEnabled: (enabled: boolean) => void;
  toggleMixerEnabled: () => void;
  setActiveTab: (tab: MixerTab) => void;
  setStreamerMode: (enabled: boolean) => void;
  toggleStreamerMode: () => void;
  setChatMix: (val: number) => void;
  setHeadphoneVolume: (channelId: MixerChannelId, volume: number) => void;
  setStreamVolume: (channelId: MixerChannelId, volume: number) => void;
  adjustVolumeStep: (channelId: MixerChannelId, target: "headphone" | "stream", delta: number) => void;
  toggleHeadphoneMute: (channelId: MixerChannelId) => void;
  toggleStreamMute: (channelId: MixerChannelId) => void;
  toggleMuteWithHud: (channelId: MixerChannelId, target: "headphone" | "stream") => void;
  setChannelPreset: (channelId: MixerChannelId, preset: string) => void;
  toggleChannelDsp: (channelId: MixerChannelId) => void;
  saveCustomPreset: (channelId: MixerChannelId, name: string) => void;
  deleteCustomPreset: (channelId: MixerChannelId, presetId: string) => void;
  assignApp: (channelId: MixerChannelId, app: MixerApp) => void;
  unassignApp: (channelId: MixerChannelId, appId: string) => void;
  moveApp: (from: MixerChannelId, to: MixerChannelId, appId: string) => void;
  setHeadphoneOutput: (device: string) => void;
  setStreamOutput: (device: string) => void;
  updateChannelDsp: (channelId: MixerChannelId, updates: Partial<MixerChannel>) => void;
  openChannelSettings: (id: MixerChannelId | null) => void;
  updateChannelShortcuts: (id: MixerChannelId, shortcuts: Partial<ChannelShortcuts>) => void;
  toggleChannelRouting: (id: MixerChannelId, target: "headphones" | "stream") => void;
  triggerVolumeHud: (hud: VolumeHudNotification | null) => void;
  updatePeaks: (peaks: Record<string, number>) => void;
  syncWindowsAudioSessions: () => Promise<void>;
  resetMixer: () => void;
}

// Clean channel configuration with 0 mock/fake applications
const defaultChannels: Record<MixerChannelId, MixerChannel> = {
  master: {
    id: "master",
    name: "Master",
    color: "#0A84FF",
    accentGradient: "from-[#0A84FF] to-[#0058C6]",
    headphoneVolume: 100,
    streamVolume: 100,
    headphoneMuted: false,
    streamMuted: false,
    includeInHeadphones: true,
    includeInStream: true,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "",
      headphoneVolDown: "",
      headphoneMute: "",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "",
    },
    currentPreset: "Écoute Globale",
    assignedApps: [],
    eqEnabled: true,
  },
  game: {
    id: "game",
    name: "Game",
    color: "#30D158",
    accentGradient: "from-[#30D158] to-[#1F9A3B]",
    headphoneVolume: 85,
    streamVolume: 75,
    headphoneMuted: false,
    streamMuted: false,
    includeInHeadphones: true,
    includeInStream: true,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "Ctrl+F8",
      headphoneVolDown: "Ctrl+F7",
      headphoneMute: "Ctrl+F6",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "",
    },
    currentPreset: "Jeux & Pas FPS",
    assignedApps: [],
    eqEnabled: true,
    bassBoost: 3,
    spatialAudio: true,
  },
  chat: {
    id: "chat",
    name: "Chat",
    color: "#00A6FB",
    accentGradient: "from-[#00A6FB] to-[#0582CA]",
    headphoneVolume: 90,
    streamVolume: 80,
    headphoneMuted: false,
    streamMuted: false,
    includeInHeadphones: true,
    includeInStream: false,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "F18",
      headphoneVolDown: "F17",
      headphoneMute: "F16",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "",
    },
    currentPreset: "Clarté Voix Discord",
    assignedApps: [],
    eqEnabled: true,
    voiceClarity: 5,
    noiseGate: 2,
  },
  media: {
    id: "media",
    name: "Média",
    color: "#FF2D55",
    accentGradient: "from-[#FF2D55] to-[#D00036]",
    headphoneVolume: 65,
    streamVolume: 50,
    headphoneMuted: false,
    streamMuted: false,
    includeInHeadphones: true,
    includeInStream: true,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "",
      headphoneVolDown: "",
      headphoneMute: "Ctrl+Shift+N",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "",
    },
    currentPreset: "Musique & Basses",
    assignedApps: [],
    eqEnabled: true,
    bassBoost: 2,
  },
  aux: {
    id: "aux",
    name: "Aux",
    color: "#BF5AF2",
    accentGradient: "from-[#BF5AF2] to-[#9128C4]",
    headphoneVolume: 60,
    streamVolume: 60,
    headphoneMuted: false,
    streamMuted: false,
    includeInHeadphones: true,
    includeInStream: true,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "",
      headphoneVolDown: "",
      headphoneMute: "",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "",
    },
    currentPreset: "Standard / Alertes",
    assignedApps: [],
    eqEnabled: false,
  },
  mic: {
    id: "mic",
    name: "Micro",
    color: "#FF9F0A",
    accentGradient: "from-[#FF9F0A] to-[#C97200]",
    headphoneVolume: 0,
    streamVolume: 85,
    headphoneMuted: true,
    streamMuted: false,
    includeInHeadphones: false,
    includeInStream: true,
    audioFormat: "Hi-Res 24 bit / 48 kHz",
    shortcuts: {
      headphoneVolUp: "",
      headphoneVolDown: "",
      headphoneMute: "",
      streamVolUp: "",
      streamVolDown: "",
      streamMute: "Ctrl+Shift+M",
    },
    currentPreset: "Voix Chaude Broadcast",
    assignedApps: [],
    eqEnabled: true,
    noiseGate: 6,
    compressor: 4,
    voiceClarity: 3,
  },
};

const defaultUnassignedApps: MixerApp[] = [];

const defaultChannelPeaks: Record<MixerChannelId, number> = {
  master: 0,
  game: 0,
  chat: 0,
  media: 0,
  aux: 0,
  mic: 0,
};

const defaultCustomPresets: Record<MixerChannelId, MixerDspPreset[]> = {
  master: [],
  game: [],
  chat: [],
  media: [],
  aux: [],
  mic: [],
};

function emitOverlayHud(hud: VolumeHudNotification | null) {
  if (!hud || typeof window === "undefined" || !(window as any).colorflow?.overlay?.show) return;
  (window as any).colorflow.overlay.show({
    type: "volume",
    items: [
      {
        id: `${hud.channelId}-${hud.target}`,
        channelId: hud.channelId,
        channelName: hud.channelName,
        channelColor: hud.channelColor,
        target: hud.target,
        volume: hud.volume,
        isMuted: hud.isMuted,
        actionType: hud.actionType,
      },
    ],
  });
}

function applyChannelToWindows(ch: MixerChannel, mixerEnabled: boolean) {
  if (typeof window === "undefined" || !(window as any).colorflow?.mixer) return;
  if (!mixerEnabled) return;

  const vol = ch.headphoneMuted ? 0 : ch.headphoneVolume;
  if (ch.id === "master") {
    void (window as any).colorflow.mixer.setMasterVolume(vol);
    void (window as any).colorflow.mixer.setMasterMute(ch.headphoneMuted);
  } else {
    for (const app of ch.assignedApps) {
      const proc = app.executable || app.name;
      if (proc) {
        void (window as any).colorflow.mixer.setProcessVolume(proc, vol);
        void (window as any).colorflow.mixer.setProcessMute(proc, ch.headphoneMuted);
      }
    }
  }
}

export const useMixerStore = create<MixerStore>()(
  persist(
    (set, get) => ({
      mixerEnabled: true,
      activeTab: "mixer",
      streamerMode: true,
      chatMix: 0,
      headphoneOutputDevice: "Casque (Par défaut)",
      streamOutputDevice: "OBS Virtual Audio / Stream Mix",
      selectedChannelSettings: null,
      volumeHud: null,
      customDspPresets: defaultCustomPresets,
      channels: defaultChannels,
      unassignedApps: defaultUnassignedApps,
      channelPeaks: defaultChannelPeaks,

      updatePeaks: (peaks) => {
        const state = get();
        const masterPeak = peaks.master || 0;
        const newPeaks: Record<MixerChannelId, number> = {
          master: state.channels.master.headphoneMuted ? 0 : masterPeak * (state.channels.master.headphoneVolume / 100),
          game: 0,
          chat: 0,
          media: 0,
          aux: 0,
          mic: 0,
        };

        for (const chId of ["game", "chat", "media", "aux", "mic"] as MixerChannelId[]) {
          const ch = state.channels[chId];
          if (ch.headphoneMuted) {
            newPeaks[chId] = 0;
            continue;
          }

          let maxAppPeak = 0;
          for (const app of ch.assignedApps) {
            const lower = (app.executable || app.name).toLowerCase();
            if (typeof peaks[lower] === "number") {
              maxAppPeak = Math.max(maxAppPeak, peaks[lower]);
            }
          }

          if (maxAppPeak > 0) {
            newPeaks[chId] = maxAppPeak * (ch.headphoneVolume / 100);
          } else if (masterPeak > 0 && ch.assignedApps.length > 0) {
            newPeaks[chId] = masterPeak * (ch.headphoneVolume / 100) * 0.75;
          } else {
            newPeaks[chId] = 0;
          }
        }

        set({ channelPeaks: newPeaks });
      },

      setMixerEnabled: (enabled) => {
        set({ mixerEnabled: enabled });
        const st = get();
        for (const chId of Object.keys(st.channels) as MixerChannelId[]) {
          applyChannelToWindows(st.channels[chId], enabled);
        }
      },

      toggleMixerEnabled: () => {
        const next = !get().mixerEnabled;
        set({ mixerEnabled: next });
        const st = get();
        for (const chId of Object.keys(st.channels) as MixerChannelId[]) {
          applyChannelToWindows(st.channels[chId], next);
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setStreamerMode: (enabled) => set({ streamerMode: enabled }),

      toggleStreamerMode: () => set((s) => ({ streamerMode: !s.streamerMode })),

      setChatMix: (val) => set({ chatMix: Math.max(-100, Math.min(100, val)) }),

      setHeadphoneVolume: (channelId, volume) => {
        const clamped = Math.max(0, Math.min(100, volume));
        set((s) => {
          const updatedCh = {
            ...s.channels[channelId],
            headphoneVolume: clamped,
          };
          applyChannelToWindows(updatedCh, s.mixerEnabled);
          return {
            channels: {
              ...s.channels,
              [channelId]: updatedCh,
            },
          };
        });
      },

      setStreamVolume: (channelId, volume) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: {
              ...s.channels[channelId],
              streamVolume: Math.max(0, Math.min(100, volume)),
            },
          },
        })),

      adjustVolumeStep: (channelId, target, delta) => {
        const state = get();
        const ch = state.channels[channelId];
        if (!ch) return;

        if (target === "headphone") {
          const newVol = Math.max(0, Math.min(100, ch.headphoneVolume + delta));
          const updatedCh = { ...ch, headphoneVolume: newVol };
          applyChannelToWindows(updatedCh, state.mixerEnabled);
          const hud: VolumeHudNotification = {
            channelId,
            channelName: ch.name,
            channelColor: ch.color,
            target: "headphone",
            volume: newVol,
            isMuted: ch.headphoneMuted,
            actionType: delta > 0 ? "up" : "down",
          };
          emitOverlayHud(hud);
          set({
            channels: {
              ...state.channels,
              [channelId]: updatedCh,
            },
            volumeHud: hud,
          });
        } else {
          const newVol = Math.max(0, Math.min(100, ch.streamVolume + delta));
          const hud: VolumeHudNotification = {
            channelId,
            channelName: ch.name,
            channelColor: ch.color,
            target: "stream",
            volume: newVol,
            isMuted: ch.streamMuted,
            actionType: delta > 0 ? "up" : "down",
          };
          emitOverlayHud(hud);
          set({
            channels: {
              ...state.channels,
              [channelId]: { ...ch, streamVolume: newVol },
            },
            volumeHud: hud,
          });
        }
      },

      toggleHeadphoneMute: (channelId) => {
        const state = get();
        const ch = state.channels[channelId];
        if (!ch) return;
        const nextMuted = !ch.headphoneMuted;
        const updatedCh = { ...ch, headphoneMuted: nextMuted };
        applyChannelToWindows(updatedCh, state.mixerEnabled);
        const hud: VolumeHudNotification = {
          channelId,
          channelName: ch.name,
          channelColor: ch.color,
          target: "headphone",
          volume: ch.headphoneVolume,
          isMuted: nextMuted,
          actionType: "mute",
        };
        emitOverlayHud(hud);
        set({
          channels: {
            ...state.channels,
            [channelId]: updatedCh,
          },
          volumeHud: hud,
        });
      },

      toggleStreamMute: (channelId) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: {
              ...s.channels[channelId],
              streamMuted: !s.channels[channelId].streamMuted,
            },
          },
        })),

      toggleMuteWithHud: (channelId, target) => {
        const state = get();
        const ch = state.channels[channelId];
        if (!ch) return;

        if (target === "headphone") {
          const nextMuted = !ch.headphoneMuted;
          const updatedCh = { ...ch, headphoneMuted: nextMuted };
          applyChannelToWindows(updatedCh, state.mixerEnabled);
          const hud: VolumeHudNotification = {
            channelId,
            channelName: ch.name,
            channelColor: ch.color,
            target: "headphone",
            volume: ch.headphoneVolume,
            isMuted: nextMuted,
            actionType: "mute",
          };
          emitOverlayHud(hud);
          set({
            channels: {
              ...state.channels,
              [channelId]: updatedCh,
            },
            volumeHud: hud,
          });
        } else {
          const nextMuted = !ch.streamMuted;
          const hud: VolumeHudNotification = {
            channelId,
            channelName: ch.name,
            channelColor: ch.color,
            target: "stream",
            volume: ch.streamVolume,
            isMuted: nextMuted,
            actionType: "mute",
          };
          emitOverlayHud(hud);
          set({
            channels: {
              ...state.channels,
              [channelId]: { ...ch, streamMuted: nextMuted },
            },
            volumeHud: hud,
          });
        }
      },

      setChannelPreset: (channelId, preset) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: {
              ...s.channels[channelId],
              currentPreset: preset,
            },
          },
        })),

      toggleChannelDsp: (channelId) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: {
              ...s.channels[channelId],
              eqEnabled: !s.channels[channelId].eqEnabled,
            },
          },
        })),

      saveCustomPreset: (channelId, name) =>
        set((s) => {
          const ch = s.channels[channelId];
          const newPreset: MixerDspPreset = {
            id: nanoid(8),
            name: name.trim() || `Profil ${ch.name} Perso`,
            channelId,
            bassBoost: ch.bassBoost || 0,
            voiceClarity: ch.voiceClarity || 0,
            noiseGate: ch.noiseGate || 0,
            compressor: ch.compressor || 0,
            spatialAudio: ch.spatialAudio || false,
            isCustom: true,
          };

          return {
            customDspPresets: {
              ...s.customDspPresets,
              [channelId]: [...(s.customDspPresets[channelId] || []), newPreset],
            },
            channels: {
              ...s.channels,
              [channelId]: {
                ...ch,
                currentPreset: newPreset.name,
              },
            },
          };
        }),

      deleteCustomPreset: (channelId, presetId) =>
        set((s) => {
          const list = s.customDspPresets[channelId] || [];
          const updated = list.filter((p) => p.id !== presetId);
          return {
            customDspPresets: {
              ...s.customDspPresets,
              [channelId]: updated,
            },
          };
        }),

      assignApp: (channelId, app) =>
        set((s) => {
          const newChannels = { ...s.channels };
          for (const ch of Object.keys(newChannels) as MixerChannelId[]) {
            newChannels[ch] = {
              ...newChannels[ch],
              assignedApps: newChannels[ch].assignedApps.filter((a) => a.id !== app.id),
            };
          }
          newChannels[channelId] = {
            ...newChannels[channelId],
            assignedApps: [...newChannels[channelId].assignedApps, app],
          };
          const newUnassigned = s.unassignedApps.filter((a) => a.id !== app.id);
          applyChannelToWindows(newChannels[channelId], s.mixerEnabled);
          return { channels: newChannels, unassignedApps: newUnassigned };
        }),

      unassignApp: (channelId, appId) =>
        set((s) => {
          const ch = s.channels[channelId];
          const app = ch.assignedApps.find((a) => a.id === appId);
          if (!app) return s;
          return {
            channels: {
              ...s.channels,
              [channelId]: {
                ...ch,
                assignedApps: ch.assignedApps.filter((a) => a.id !== appId),
              },
            },
            unassignedApps: [...s.unassignedApps, app],
          };
        }),

      moveApp: (from, to, appId) =>
        set((s) => {
          if (from === to) return s;
          const fromCh = s.channels[from];
          const toCh = s.channels[to];
          if (!fromCh || !toCh) return s;

          const app = fromCh.assignedApps.find((a) => a.id === appId);
          if (!app) return s;

          const nextToCh = {
            ...toCh,
            assignedApps: [...toCh.assignedApps, app],
          };

          applyChannelToWindows(nextToCh, s.mixerEnabled);

          return {
            channels: {
              ...s.channels,
              [from]: {
                ...fromCh,
                assignedApps: fromCh.assignedApps.filter((a) => a.id !== appId),
              },
              [to]: nextToCh,
            },
          };
        }),

      setHeadphoneOutput: (device) => set({ headphoneOutputDevice: device }),

      setStreamOutput: (device) => set({ streamOutputDevice: device }),

      updateChannelDsp: (channelId, updates) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [channelId]: {
              ...s.channels[channelId],
              ...updates,
            },
          },
        })),

      openChannelSettings: (id) => set({ selectedChannelSettings: id }),

      updateChannelShortcuts: (id, shortcuts) =>
        set((s) => ({
          channels: {
            ...s.channels,
            [id]: {
              ...s.channels[id],
              shortcuts: {
                ...s.channels[id].shortcuts,
                ...shortcuts,
              },
            },
          },
        })),

      toggleChannelRouting: (id, target) =>
        set((s) => {
          const ch = s.channels[id];
          if (target === "headphones") {
            return {
              channels: {
                ...s.channels,
                [id]: { ...ch, includeInHeadphones: !ch.includeInHeadphones },
              },
            };
          } else {
            return {
              channels: {
                ...s.channels,
                [id]: { ...ch, includeInStream: !ch.includeInStream },
              },
            };
          }
        }),

      triggerVolumeHud: (hud) => {
        emitOverlayHud(hud);
        set({ volumeHud: hud });
      },

      syncWindowsAudioSessions: async () => {
        if (typeof window === "undefined" || !(window as any).colorflow?.mixer?.getSessions) return;
        try {
          const sessions = await (window as any).colorflow.mixer.getSessions();
          if (!sessions || !Array.isArray(sessions)) return;

          const state = get();
          const assignedMap = new Set<string>();
          for (const chId of Object.keys(state.channels) as MixerChannelId[]) {
            for (const a of state.channels[chId].assignedApps) {
              if (a.executable) assignedMap.add(a.executable.toLowerCase());
              if (a.name) assignedMap.add(a.name.toLowerCase());
            }
          }
          for (const a of state.unassignedApps) {
            if (a.executable) assignedMap.add(a.executable.toLowerCase());
            if (a.name) assignedMap.add(a.name.toLowerCase());
          }

          const newAppsToAdd: Record<MixerChannelId, MixerApp[]> = {
            master: [],
            game: [],
            chat: [],
            media: [],
            aux: [],
            mic: [],
          };

          for (const s of sessions) {
            if (!s.processName || s.processName === "System" || s.processName === "Système Windows") continue;
            const lower = s.processName.toLowerCase();
            if (assignedMap.has(lower)) continue;
            assignedMap.add(lower);

            let targetChannel: MixerChannelId = "game";
            let color = "#30D158";
            if (["discord", "teams", "telegram", "slack", "skype", "whatsapp", "zoom"].some((k) => lower.includes(k))) {
              targetChannel = "chat";
              color = "#0A84FF";
            } else if (["spotify", "chrome", "msedge", "firefox", "brave", "vlc", "applemusic", "deezer", "tidal"].some((k) => lower.includes(k))) {
              targetChannel = "media";
              color = "#FF9F0A";
            } else if (["obs", "streamlabs", "xsplit"].some((k) => lower.includes(k))) {
              targetChannel = "aux";
              color = "#AF52DE";
            }

            newAppsToAdd[targetChannel].push({
              id: `app-win-${s.pid || nanoid(5)}`,
              name: s.processName,
              executable: s.processName,
              color,
              badgeBg: `${color}22`,
              badgeText: color,
            });
          }

          let hasChanges = false;
          const nextChannels = { ...state.channels };
          for (const chId of Object.keys(newAppsToAdd) as MixerChannelId[]) {
            if (newAppsToAdd[chId].length > 0) {
              hasChanges = true;
              nextChannels[chId] = {
                ...nextChannels[chId],
                assignedApps: [...nextChannels[chId].assignedApps, ...newAppsToAdd[chId]],
              };
              applyChannelToWindows(nextChannels[chId], state.mixerEnabled);
            }
          }

          if (hasChanges) {
            set({ channels: nextChannels });
          }
        } catch (err) {
          console.warn("Failed to sync Windows audio sessions:", err);
        }
      },

      resetMixer: () =>
        set({
          mixerEnabled: true,
          channels: defaultChannels,
          unassignedApps: defaultUnassignedApps,
          customDspPresets: defaultCustomPresets,
          channelPeaks: defaultChannelPeaks,
          chatMix: 0,
        }),
    }),
    {
      name: "serenity-mixer-storage-v8",
    }
  )
);
