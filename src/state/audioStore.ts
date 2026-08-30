import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AudioState, ParametricFilter, EQMode, AudioPreset } from '@/types/audio';
import { EQEngine } from '@/lib/eq-engine';
import { nanoid } from 'nanoid';

interface AudioStore extends AudioState {
  setMode: (mode: EQMode) => void;
  setGraphicBands: (bands: number) => void;
  setPreamp: (preamp: number) => void;
  setGraphicFilter: (freq: number, gain: number) => void;
  setAllGraphicFilters: (filters: Record<number, number>) => void;
  setParametricFilters: (filters: ParametricFilter[]) => void;
  addParametricFilter: (preset?: Partial<ParametricFilter>) => void;
  removeParametricFilter: (index: number) => void;
  updateParametricFilter: (index: number, updates: Partial<ParametricFilter>) => void;
  setDevices: (devices: string[]) => void;
  toggleDevice: (device: string) => void;
  setChannel: (channel: string) => void;
  setBassBoost: (val: number) => void;
  setTrebleAir: (val: number) => void;
  setStereoBalance: (val: number) => void;
  toggleCrossfeed: () => void;
  toggleLoudnessGuard: () => void;
  toggleEqEnabled: () => void;
  applyPreset: (preset: AudioPreset) => void;
  saveCustomPreset: (name: string, description?: string) => AudioPreset;
  deleteCustomPreset: (id: string) => void;
  quickCurveAction: (action: 'flat' | 'v-shape' | 'bass' | 'treble' | 'smooth' | 'invert') => void;
  resetEq: () => void;
}

const FILTER_COLORS = [
  '#0A84FF', // Apple Blue
  '#30D158', // Apple Green
  '#FF9F0A', // Apple Orange
  '#BF5AF2', // Apple Purple
  '#FF375F', // Apple Pink
  '#64D2FF', // Apple Cyan
  '#FFD60A', // Apple Yellow
  '#5E5CE6', // Apple Indigo
];

const defaultParametricFilters: ParametricFilter[] = [
  { id: 'f-1', enabled: true, type: 'LS', freq: 80, gain: 0, q: 0.71, color: FILTER_COLORS[0] },
  { id: 'f-2', enabled: true, type: 'PK', freq: 250, gain: 0, q: 1.41, color: FILTER_COLORS[1] },
  { id: 'f-3', enabled: true, type: 'PK', freq: 1000, gain: 0, q: 1.41, color: FILTER_COLORS[2] },
  { id: 'f-4', enabled: true, type: 'PK', freq: 4000, gain: 0, q: 1.41, color: FILTER_COLORS[3] },
  { id: 'f-5', enabled: true, type: 'HS', freq: 12000, gain: 0, q: 0.71, color: FILTER_COLORS[4] }
];

const getDefaultGraphicFilters = (bands: number): Record<number, number> => {
  const freqs = EQEngine.getBands(bands);
  const filters: Record<number, number> = {};
  freqs.forEach(f => {
    filters[f] = 0;
  });
  return filters;
};

// Function to call the APO backend
const applyToAPO = (state: AudioState) => {
  try {
    // @ts-ignore
    if (window.serenity && window.serenity.audio && window.serenity.audio.writeConfig) {
      if (!state.eqEnabled) {
        // If disabled, apply an empty config or bypass
        // @ts-ignore
        window.serenity.audio.writeConfig("# Serenity EQ Bypassed");
        return;
      }
      const configString = EQEngine.generateConfig(state);
      // @ts-ignore
      window.serenity.audio.writeConfig(configString);
    }
  } catch (e) {
    console.error('Failed to sync with APO backend', e);
  }
};

export const useAudioStore = create<AudioStore>()(
  persist(
    (set, get) => ({
      mode: 'parametric',
      graphicBands: 10,
      preamp: 0,
      graphicFilters: getDefaultGraphicFilters(10),
      parametricFilters: defaultParametricFilters,
      devices: ['all'],
      channel: 'all',
      eqEnabled: true,
      bassBoost: 0,
      trebleAir: 0,
      stereoBalance: 0,
      crossfeed: false,
      loudnessGuard: true,
      activePresetName: null,
      customPresets: [],

      setMode: (mode) => {
        set({ mode });
        applyToAPO(get());
      },
      
      setGraphicBands: (bands) => {
        const currentFilters = get().graphicFilters;
        const newFreqs = EQEngine.getBands(bands);
        const newFilters: Record<number, number> = {};
        
        newFreqs.forEach(f => {
          newFilters[f] = currentFilters[f] !== undefined ? currentFilters[f]! : 0;
        });
        
        set({ graphicBands: bands, graphicFilters: newFilters });
        applyToAPO(get());
      },

      setPreamp: (preamp) => {
        set({ preamp });
        applyToAPO(get());
      },

      setGraphicFilter: (freq, gain) => {
        set((state) => ({
          graphicFilters: {
            ...state.graphicFilters,
            [freq]: gain
          },
          activePresetName: null
        }));
        applyToAPO(get());
      },

      setAllGraphicFilters: (filters) => {
        set({ graphicFilters: filters, activePresetName: null });
        applyToAPO(get());
      },

      setParametricFilters: (filters) => {
        const withColors = filters.map((f, i) => ({
          ...f,
          id: f.id || `f-${nanoid(6)}`,
          color: f.color || FILTER_COLORS[i % FILTER_COLORS.length]
        }));
        set({ parametricFilters: withColors, activePresetName: null });
        applyToAPO(get());
      },

      addParametricFilter: (preset) => {
        const filters = get().parametricFilters;
        if (filters.length >= 24) return;
        const newIndex = filters.length;
        const newFilter: ParametricFilter = {
          id: `f-${nanoid(6)}`,
          enabled: true,
          type: preset?.type || 'PK',
          freq: preset?.freq || (newIndex === 0 ? 100 : Math.min(16000, Math.round(filters[newIndex - 1]?.freq || 1000) * 1.8)),
          gain: preset?.gain ?? 0,
          q: preset?.q || 1.41,
          color: FILTER_COLORS[newIndex % FILTER_COLORS.length]
        };
        set({ parametricFilters: [...filters, newFilter], activePresetName: null });
        applyToAPO(get());
      },

      removeParametricFilter: (index) => {
        set((state) => ({
          parametricFilters: state.parametricFilters.filter((_, i) => i !== index),
          activePresetName: null
        }));
        applyToAPO(get());
      },

      updateParametricFilter: (index, updates) => {
        set((state) => ({
          parametricFilters: state.parametricFilters.map((filter, i) => 
            i === index ? { ...filter, ...updates } : filter
          ),
          activePresetName: null
        }));
        applyToAPO(get());
      },


      setDevices: (devices) => {
        set({ devices });
        applyToAPO(get());
      },
      toggleDevice: (device) => {
        const state = get();
        let newDevices = [...state.devices];
        
        if (device === 'all') {
          newDevices = ['all'];
        } else {
          // Remove 'all' if present
          newDevices = newDevices.filter(d => d !== 'all');
          
          if (newDevices.includes(device)) {
            newDevices = newDevices.filter(d => d !== device);
            if (newDevices.length === 0) newDevices = ['all'];
          } else {
            newDevices.push(device);
          }
        }
        
        set({ devices: newDevices });
        applyToAPO(get());
      },


      setChannel: (channel) => {
        set({ channel });
        applyToAPO(get());
      },

      setBassBoost: (val) => {
        set({ bassBoost: val });
        applyToAPO(get());
      },

      setTrebleAir: (val) => {
        set({ trebleAir: val });
        applyToAPO(get());
      },

      setStereoBalance: (val) => {
        set({ stereoBalance: val });
        applyToAPO(get());
      },

      toggleCrossfeed: () => {
        set((state) => ({ crossfeed: !state.crossfeed }));
        applyToAPO(get());
      },

      toggleLoudnessGuard: () => {
        set((state) => ({ loudnessGuard: !state.loudnessGuard }));
        applyToAPO(get());
      },

      toggleEqEnabled: () => {
        set((state) => ({ eqEnabled: !state.eqEnabled }));
        applyToAPO(get());
      },

      applyPreset: (preset) => {
        const nextState: Partial<AudioState> = {
          mode: preset.mode,
          preamp: preset.preamp,
          activePresetName: preset.name,
        };

        if (preset.bassBoost !== undefined) nextState.bassBoost = preset.bassBoost;
        if (preset.trebleAir !== undefined) nextState.trebleAir = preset.trebleAir;
        if (preset.crossfeed !== undefined) nextState.crossfeed = preset.crossfeed;

        if (preset.mode === 'graphic' && preset.graphicFilters) {
          nextState.graphicFilters = { ...preset.graphicFilters };
          nextState.graphicBands = Object.keys(preset.graphicFilters).length;
        } else if (preset.parametricFilters) {
          nextState.parametricFilters = preset.parametricFilters.map((f, i) => ({
            ...f,
            id: f.id || `f-${nanoid(6)}`,
            color: f.color || FILTER_COLORS[i % FILTER_COLORS.length]
          }));
        }

        set(nextState as any);
        applyToAPO(get());
      },

      saveCustomPreset: (name, description) => {
        const state = get();
        const customPreset: AudioPreset = {
          id: `user-${nanoid(8)}`,
          name,
          category: 'user',
          description: description || 'Profil personnalisé utilisateur',
          mode: state.mode,
          preamp: state.preamp,
          graphicFilters: state.mode === 'graphic' ? { ...state.graphicFilters } : undefined,
          parametricFilters: state.mode === 'parametric' ? [...state.parametricFilters] : undefined,
          bassBoost: state.bassBoost,
          trebleAir: state.trebleAir,
          crossfeed: state.crossfeed,
          icon: 'Bookmark'
        };

        set({
          customPresets: [...state.customPresets, customPreset],
          activePresetName: name
        });

        return customPreset;
      },

      deleteCustomPreset: (id) => {
        set((state) => ({
          customPresets: state.customPresets.filter((p) => p.id !== id)
        }));
      },

      quickCurveAction: (action) => {
        const state = get();
        if (state.mode === 'graphic') {
          const current = { ...state.graphicFilters };
          const freqs = Object.keys(current).map(Number).sort((a, b) => a - b);
          
          if (action === 'flat') {
            freqs.forEach(f => { current[f] = 0; });
          } else if (action === 'v-shape') {
            const count = freqs.length;
            freqs.forEach((f, idx) => {
              const norm = Math.abs((idx / (count - 1)) * 2 - 1); // 1 at ends, 0 at center
              current[f] = Math.round((norm * 6 - 2) * 10) / 10;
            });
          } else if (action === 'bass') {
            freqs.forEach((f, idx) => {
              const ratio = 1 - (idx / (freqs.length - 1));
              current[f] = Math.round((ratio * 6) * 10) / 10;
            });
          } else if (action === 'treble') {
            freqs.forEach((f, idx) => {
              const ratio = idx / (freqs.length - 1);
              current[f] = Math.round((ratio * 5) * 10) / 10;
            });
          } else if (action === 'invert') {
            freqs.forEach(f => { current[f] = -(current[f] || 0); });
          } else if (action === 'smooth') {
            const smoothed: Record<number, number> = {};
            for (let i = 0; i < freqs.length; i++) {
              const prev = current[freqs[Math.max(0, i - 1)]!] ?? 0;
              const curr = current[freqs[i]!] ?? 0;
              const next = current[freqs[Math.min(freqs.length - 1, i + 1)]!] ?? 0;
              smoothed[freqs[i]!] = Math.round(((prev + curr * 2 + next) / 4) * 10) / 10;
            }
            Object.assign(current, smoothed);
          }
          
          set({ graphicFilters: current, activePresetName: null });
        } else {
          if (action === 'flat') {
            set({
              parametricFilters: state.parametricFilters.map(f => ({ ...f, gain: 0 })),
              activePresetName: null
            });
          } else if (action === 'invert') {
            set({
              parametricFilters: state.parametricFilters.map(f => ({ ...f, gain: -f.gain })),
              activePresetName: null
            });
          }
        }
        applyToAPO(get());
      },

      resetEq: () => {
        const state = get();
        if (state.mode === 'graphic') {
          set({
            graphicFilters: getDefaultGraphicFilters(state.graphicBands),
            preamp: 0,
            bassBoost: 0,
            trebleAir: 0,
            stereoBalance: 0,
            crossfeed: false,
            activePresetName: null
          });
        } else {
          set({ 
            parametricFilters: defaultParametricFilters.map(f => ({ ...f, gain: 0 })),
            preamp: 0,
            bassBoost: 0,
            trebleAir: 0,
            stereoBalance: 0,
            crossfeed: false,
            activePresetName: null
          });
        }
        applyToAPO(get());
      }
    }),
    {
      name: 'serenity-audio-storage-v4',
      version: 4,
      migrate: (persistedState: any) => {
        // Convert old single 'device' string to new 'devices' array
        let devices: string[];
        if (Array.isArray(persistedState?.devices)) {
          devices = persistedState.devices;
        } else if (typeof persistedState?.device === 'string') {
          devices = persistedState.device === 'all' ? ['all'] : [persistedState.device];
        } else {
          devices = ['all'];
        }

        return {
          mode: persistedState?.mode || 'parametric',
          graphicBands: persistedState?.graphicBands || 10,
          preamp: persistedState?.preamp ?? 0,
          graphicFilters: persistedState?.graphicFilters || getDefaultGraphicFilters(10),
          parametricFilters: Array.isArray(persistedState?.parametricFilters) && persistedState.parametricFilters.length > 0
            ? persistedState.parametricFilters
            : defaultParametricFilters,
          devices,
          channel: persistedState?.channel || 'all',
          eqEnabled: persistedState?.eqEnabled ?? true,
          bassBoost: persistedState?.bassBoost ?? 0,
          trebleAir: persistedState?.trebleAir ?? 0,
          stereoBalance: persistedState?.stereoBalance ?? 0,
          crossfeed: persistedState?.crossfeed ?? false,
          loudnessGuard: persistedState?.loudnessGuard ?? true,
          activePresetName: persistedState?.activePresetName || null,
          customPresets: persistedState?.customPresets || [],
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => applyToAPO(state), 400);
        }
      },
    }
  )
);

