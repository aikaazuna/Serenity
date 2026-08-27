import React, { useState } from "react";
import type { MixerChannel, MixerChannelId } from "@/types/mixer";
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
  Plus,
  X,
  GripVertical,
  SlidersHorizontal,
  Power,
  Layers,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

interface MixerChannelStripProps {
  channel: MixerChannel;
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

export const MixerChannelStrip: React.FC<MixerChannelStripProps> = ({ channel }) => {
  const t = useI18n();
  const streamerMode = useMixerStore((s) => s.streamerMode);
  const setHeadphoneVolume = useMixerStore((s) => s.setHeadphoneVolume);
  const setStreamVolume = useMixerStore((s) => s.setStreamVolume);
  const toggleHeadphoneMute = useMixerStore((s) => s.toggleHeadphoneMute);
  const toggleStreamMute = useMixerStore((s) => s.toggleStreamMute);
  const toggleChannelDsp = useMixerStore((s) => s.toggleChannelDsp);
  const setActiveTab = useMixerStore((s) => s.setActiveTab);
  const openChannelSettings = useMixerStore((s) => s.openChannelSettings);
  const unassignApp = useMixerStore((s) => s.unassignApp);
  const assignApp = useMixerStore((s) => s.assignApp);
  const moveApp = useMixerStore((s) => s.moveApp);
  const unassignedApps = useMixerStore((s) => s.unassignedApps);
  const channelPeaks = useMixerStore((s) => s.channelPeaks);

  const [addAppOpen, setAddAppOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const ChannelIcon = getChannelIcon(channel.id);
  const currentPeak = channelPeaks ? (channelPeaks[channel.id] || 0) : 0;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ appId, fromChannel: channel.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.appId && data.fromChannel) {
          moveApp(data.fromChannel as MixerChannelId, channel.id, data.appId);
        }
      }
    } catch (err) {
      console.error("Drop app error", err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`apple-inner-box p-3.5 rounded-2xl flex flex-col gap-3.5 border transition-all duration-200 min-w-[170px] max-w-[200px] flex-1 select-none shadow-sm ${
        isDragOver
          ? "border-2 border-dashed scale-[1.02] shadow-lg"
          : "border-[color:var(--card-border-inner)] bg-[color:var(--card-bg)] hover:border-[color:var(--panel-border-strong)]"
      }`}
      style={{
        borderColor: isDragOver ? channel.color : undefined,
        backgroundColor: isDragOver ? `${channel.color}10` : undefined,
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

      {/* 4. Applications Footer - Fixed Height h-[104px] */}
      <div className="pt-2 border-t border-[color:var(--panel-border)] h-[104px] flex flex-col justify-between flex-none relative">
        {channel.id === "master" ? (
          <>
            <div className="h-4 flex items-center justify-between text-[10px] text-secondary font-bold uppercase tracking-wider">
              <span>Sortie Mix</span>
              <Layers className="w-3 h-3 text-[#0A84FF] opacity-75" />
            </div>

            <div className="h-[74px] rounded-xl bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/10 p-2 flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[10.5px] font-bold text-[color:var(--text-primary)]">
                Sortie Générale
              </span>
              <span className="text-[9.5px] text-tertiary leading-tight">
                Mixe l'ensemble des canaux audio
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="h-4 flex items-center justify-between text-[10px] text-secondary font-bold uppercase tracking-wider">
              <span>{t.mixer.applications}</span>
              <button
                type="button"
                onClick={() => setAddAppOpen((o) => !o)}
                className="text-secondary hover:text-[#0A84FF] transition cursor-pointer p-0.5"
                title={t.mixer.addApp}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Badges List */}
            <div
              className={`h-[74px] overflow-y-auto p-1.5 rounded-xl border flex flex-wrap gap-1 items-start content-start transition-all scrollbar-thin ${
                isDragOver
                  ? "bg-[color:var(--panel-bg-strong)] border-[#0A84FF] ring-2 ring-[#0A84FF]/20"
                  : "bg-neutral-100 dark:bg-black/25 border-neutral-200 dark:border-white/10"
              }`}
            >
              {channel.assignedApps.length === 0 ? (
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic px-1 leading-tight my-auto">
                  {isDragOver ? "Relâchez pour déposer" : "Glissez une app ici"}
                </span>
              ) : (
                channel.assignedApps.map((app) => (
                  <span
                    key={app.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, app.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 shadow-xs"
                    style={{
                      backgroundColor: app.badgeBg || `${app.color || channel.color}20`,
                      color: app.badgeText || app.color || channel.color,
                      borderColor: `${app.color || channel.color}40`,
                    }}
                    title="Glissez vers une autre piste pour déplacer"
                  >
                    <GripVertical className="w-2.5 h-2.5 opacity-50 shrink-0" />
                    <span className="truncate max-w-[75px]">{app.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unassignApp(channel.id, app.id);
                      }}
                      className="hover:opacity-80 transition cursor-pointer ml-0.5"
                      title="Retirer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Add App Popover */}
            {addAppOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-xl shadow-xl p-2 z-[250] backdrop-blur-xl space-y-1 text-xs">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block px-1">
                  {t.mixer.unassigned}
                </span>
                {unassignedApps.length === 0 ? (
                  <span className="text-[10px] text-neutral-400 italic block p-1">
                    Toutes les apps sont assignées
                  </span>
                ) : (
                  unassignedApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        assignApp(channel.id, app);
                        setAddAppOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-1.5 hover:bg-[color:var(--panel-bg-strong)] rounded-lg text-left transition cursor-pointer text-[11px] text-[color:var(--text-primary)]"
                    >
                      <span className="truncate">{app.name}</span>
                      <Plus className="w-3 h-3 text-secondary shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
