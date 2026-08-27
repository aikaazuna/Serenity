import React from "react";
import type { MixerChannel } from "@/types/mixer";
import { useMixerStore } from "@/state/mixerStore";
import { MixerFader } from "./MixerFader";
import {
  Headphones,
  Radio,
  Sliders,
  Gamepad2,
  Mic2,
  Music,
  Mic,
  Volume2,
  Settings,
  SlidersHorizontal,
  Power,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface MixerChannelStripProps {
  channel: MixerChannel;
  isSelected: boolean;
  onSelect: () => void;
}

const getChannelIcon = (id: string) => {
  switch (id) {
    case "master": return Sliders;
    case "game": return Gamepad2;
    case "chat": return Mic2;
    case "media": return Music;
    case "aux": return Radio;
    case "mic": return Mic;
    default: return Volume2;
  }
};

export const MixerChannelStrip: React.FC<MixerChannelStripProps> = ({ channel, isSelected, onSelect }) => {
  const t = useI18n();
  const streamerMode = useMixerStore((s) => s.streamerMode);
  const setHeadphoneVolume = useMixerStore((s) => s.setHeadphoneVolume);
  const setStreamVolume = useMixerStore((s) => s.setStreamVolume);
  const toggleHeadphoneMute = useMixerStore((s) => s.toggleHeadphoneMute);
  const toggleStreamMute = useMixerStore((s) => s.toggleStreamMute);
  const toggleChannelDsp = useMixerStore((s) => s.toggleChannelDsp);
  const setActiveTab = useMixerStore((s) => s.setActiveTab);
  const openChannelSettings = useMixerStore((s) => s.openChannelSettings);
  const channelPeaks = useMixerStore((s) => s.channelPeaks);

  const ChannelIcon = getChannelIcon(channel.id);
  const currentPeak = channelPeaks ? (channelPeaks[channel.id] || 0) : 0;

  return (
    <div
      onClick={onSelect}
      className={`apple-inner-box p-3.5 rounded-2xl flex flex-col gap-3.5 border transition-all duration-200 min-w-[170px] max-w-[200px] flex-1 select-none shadow-sm cursor-pointer ${
        isSelected
          ? "border-[2px] shadow-lg scale-[1.01]"
          : "border-[color:var(--card-border-inner)] bg-[color:var(--card-bg)] hover:border-[color:var(--panel-border-strong)]"
      }`}
      style={{
        borderColor: isSelected ? channel.color : undefined,
        backgroundColor: isSelected ? `${channel.color}15` : undefined,
      }}
    >
      {/* 1. Header (Icon, Name, Settings Cog) - Fixed height h-7 */}
      <div className="flex items-center justify-between h-7 flex-none">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: `${channel.color}20`, color: channel.color }}
          >
            <ChannelIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-primary)] truncate">
            {channel.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => openChannelSettings(channel.id)}
          title={`Raccourcis & Réglages de ${channel.name}`}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] transition cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Preset & Power Bypass Pill - Fixed height h-7 */}
      <div className="flex items-center gap-1.5 h-7 flex-none">
        <button
          type="button"
          onClick={() => setActiveTab(channel.id)}
          title={`Modifier l'égaliseur de ${channel.name}`}
          className={`flex-1 h-7 px-2 rounded-lg text-[10px] font-semibold border transition truncate flex items-center justify-between cursor-pointer shadow-xs ${
            channel.eqEnabled
              ? "text-secondary hover:text-[color:var(--text-primary)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] border-[color:var(--panel-border)]"
              : "text-neutral-400 bg-neutral-500/10 border-neutral-500/20 line-through opacity-60"
          }`}
        >
          <span className="truncate">{channel.currentPreset}</span>
          <SlidersHorizontal className="w-3 h-3 shrink-0 ml-1 opacity-70" />
        </button>

        {/* Quick DSP ON/OFF Toggle */}
        <button
          type="button"
          onClick={() => toggleChannelDsp(channel.id)}
          title={channel.eqEnabled ? "Désactiver l'égaliseur sur ce canal" : "Activer l'égaliseur sur ce canal"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition cursor-pointer shrink-0 shadow-xs ${
            channel.eqEnabled
              ? "bg-[#30D158]/20 border-[#30D158]/40 text-[#30D158]"
              : "bg-neutral-500/15 border-neutral-500/25 text-neutral-400"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Faders Area - Generous Height h-[260px] with lots of breathing room */}
      <div className="h-[260px] flex items-center justify-center flex-none py-1.5 my-0.5">
        {streamerMode ? (
          <div className="grid grid-cols-2 gap-3 w-full h-full">
            {/* Headphone Mix Fader */}
            <MixerFader
              icon={Headphones}
              volume={channel.headphoneVolume}
              isMuted={channel.headphoneMuted}
              accentColor={channel.color}
              livePeak={currentPeak}
              onVolumeChange={(val) => setHeadphoneVolume(channel.id, val)}
              onToggleMute={() => toggleHeadphoneMute(channel.id)}
              title={`${channel.name} - ${t.mixer.headphonesMix}`}
            />

            {/* Stream Mix Fader */}
            <MixerFader
              icon={Radio}
              volume={channel.streamVolume}
              isMuted={channel.streamMuted}
              accentColor={channel.color}
              livePeak={currentPeak * 0.9}
              onVolumeChange={(val) => setStreamVolume(channel.id, val)}
              onToggleMute={() => toggleStreamMute(channel.id)}
              title={`${channel.name} - ${t.mixer.streamMix}`}
              isStream
            />
          </div>
        ) : (
          <div className="w-20 h-full">
            <MixerFader
              icon={Headphones}
              volume={channel.headphoneVolume}
              isMuted={channel.headphoneMuted}
              accentColor={channel.color}
              livePeak={currentPeak}
              onVolumeChange={(val) => setHeadphoneVolume(channel.id, val)}
              onToggleMute={() => toggleHeadphoneMute(channel.id)}
              title={`${channel.name} - ${t.mixer.headphonesMix}`}
            />
          </div>
        )}
      </div>


    </div>
  );
};
