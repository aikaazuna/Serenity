export type FilterType =
  | 'PK'  // Peaking
  | 'LS'  // Low Shelf
  | 'HS'  // High Shelf
  | 'LP'  // Low Pass
  | 'HP'  // High Pass
  | 'NO'  // Notch
  | 'BP'  // Band Pass
  | 'AP'  // All Pass
  | 'LSC' // Low Shelf (C)
  | 'HSC' // High Shelf (C)
  | 'LSQ' // Low Shelf (Q)
  | 'HSQ'; // High Shelf (Q)

export interface ParametricFilter {
  id?: string;
  enabled: boolean;
  type: FilterType | string;
  freq: number;
  gain: number;
  q: number;
  color?: string;
}

export type EQMode = 'graphic' | 'parametric';

export type PresetCategory =
  | 'autoeq'
  | 'genre'
  | 'gaming'
  | 'cinema'
  | 'utility'
  | 'headphones'
  | 'music'
  | 'gaming_cinema'
  | 'voice_special'
  | 'user';

export interface AudioPreset {
  id: string;
  name: string;
  category: PresetCategory;
  brand?: string;
  description?: string;
  author?: string;
  mode?: EQMode;
  preamp: number;
  graphicFilters?: Record<number, number>;
  parametricFilters?: ParametricFilter[];
  bassBoost?: number;
  trebleAir?: number;
  trebleBoost?: number;
  crossfeed?: boolean;
  icon?: string;
  tags?: string[];
}

export interface AudioState {
  mode: EQMode;
  graphicBands: number;
  preamp: number;
  graphicFilters: Record<number, number>;
  parametricFilters: ParametricFilter[];
  devices: string[];
  channel: string;
  eqEnabled: boolean;
  bassBoost: number;
  trebleAir: number;
  stereoBalance: number; // -100 to 100
  crossfeed: boolean;
  loudnessGuard: boolean;
  activePresetName: string | null;
  customPresets: AudioPreset[];
}
