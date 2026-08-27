export type MixerChannelId = "master" | "game" | "chat" | "media" | "aux" | "mic";

export type MixerTab = "mixer" | "studio" | MixerChannelId;

export interface MixerApp {
  id: string;
  name: string;
  executable?: string;
  icon?: string;
  color?: string;
  badgeBg?: string;
  badgeText?: string;
}

export interface ChannelShortcuts {
  headphoneVolUp?: string;
  headphoneVolDown?: string;
  headphoneMute?: string;
  streamVolUp?: string;
  streamVolDown?: string;
  streamMute?: string;
}

export interface MixerDspPreset {
  id: string;
  name: string;
  channelId: MixerChannelId;
  bassBoost?: number;
  voiceClarity?: number;
  noiseGate?: number;
  compressor?: number;
  spatialAudio?: boolean;
  isCustom?: boolean;
}

export interface MixerChannel {
  id: MixerChannelId;
  name: string;
  color: string;
  accentGradient: string;
  headphoneVolume: number; // 0 to 100
  streamVolume: number; // 0 to 100
  headphoneMuted: boolean;
  streamMuted: boolean;
  includeInHeadphones: boolean;
  includeInStream: boolean;
  audioFormat: string;
  shortcuts: ChannelShortcuts;
  currentPreset: string;
  assignedApps: MixerApp[];
  // DSP channel parameters
  eqEnabled: boolean; // toggle DSP active / bypassed
  bassBoost?: number;
  voiceClarity?: number;
  noiseGate?: number;
  compressor?: number;
  spatialAudio?: boolean;
}

export interface VolumeHudNotification {
  channelId: MixerChannelId;
  channelName: string;
  channelColor: string;
  target: "headphone" | "stream";
  volume: number;
  isMuted: boolean;
  actionType: "up" | "down" | "mute" | "set";
}

export interface MixerState {
  mixerEnabled: boolean; // Global Mixer ON / OFF
  activeTab: MixerTab;
  streamerMode: boolean;
  chatMix: number; // -100 (Full Game) to +100 (Full Chat), 0 = 50/50
  headphoneOutputDevice: string;
  streamOutputDevice: string;
  selectedChannelSettings: MixerChannelId | null;
  volumeHud: VolumeHudNotification | null;
  customDspPresets: Record<MixerChannelId, MixerDspPreset[]>;
  channels: Record<MixerChannelId, MixerChannel>;
  unassignedApps: MixerApp[];
  channelPeaks: Record<MixerChannelId, number>;
}
