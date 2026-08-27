import React, { useState, useEffect } from "react";
import { useMixerStore } from "@/state/mixerStore";
import {
  X,
  Volume2,
  VolumeX,
  Volume1,
  Info,
  Check,
  Gamepad2,
  Mic2,
  Music,
  Radio,
  Mic,
  Sliders,
} from "lucide-react";

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

export const MixerChannelSettingsModal: React.FC = () => {
  const selectedChannelId = useMixerStore((s) => s.selectedChannelSettings);
  const openChannelSettings = useMixerStore((s) => s.openChannelSettings);
  const channels = useMixerStore((s) => s.channels);
  const toggleChannelRouting = useMixerStore((s) => s.toggleChannelRouting);
  const updateChannelShortcuts = useMixerStore((s) => s.updateChannelShortcuts);

  const [listeningKey, setListeningKey] = useState<string | null>(null);

  const channel = selectedChannelId ? channels[selectedChannelId] : null;

  useEffect(() => {
    if (!listeningKey || !selectedChannelId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setListeningKey(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let keyName = e.key;
      if (keyName === " ") keyName = "Space";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        parts.push(keyName);
        const combo = parts.join("+");
        updateChannelShortcuts(selectedChannelId, { [listeningKey]: combo });
        setListeningKey(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [listeningKey, selectedChannelId, updateChannelShortcuts]);

  if (!channel || !selectedChannelId) return null;

  const ChannelIcon = getChannelIcon(channel.id);

  const renderKeybox = (fieldKey: string, currentValue?: string) => {
    const isListening = listeningKey === fieldKey;

    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setListeningKey(isListening ? null : fieldKey)}
          className={`w-full h-8 px-2.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-between border transition cursor-pointer ${
            isListening
              ? "bg-[#0A84FF]/20 border-[#0A84FF] text-[#0A84FF] ring-2 ring-[#0A84FF]/30 animate-pulse"
              : currentValue
              ? "bg-[color:var(--panel-bg-strong)] border-[color:var(--panel-border-strong)] text-[color:var(--text-primary)] hover:border-[#0A84FF]/50"
              : "bg-black/20 border-neutral-800 text-neutral-500 hover:border-neutral-700"
          }`}
        >
          <span className="truncate">{isListening ? "Appuyez..." : currentValue || "—"}</span>
          {currentValue && !isListening && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                updateChannelShortcuts(selectedChannelId, { [fieldKey]: "" });
              }}
              className="text-neutral-500 hover:text-red-400 text-xs ml-1"
              title="Effacer le raccourci"
            >
              ×
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="apple-card w-full max-w-sm p-6 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${channel.color}20`, color: channel.color }}
            >
              <ChannelIcon className="w-4 h-4" />
            </div>
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: channel.color }}
            >
              {channel.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => openChannelSettings(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-tertiary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Section */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary block">
            Format
          </span>
          <span className="text-xs font-semibold text-[color:var(--text-primary)] font-mono">
            {channel.audioFormat}
          </span>
        </div>

        {/* Ajouter à (Routing Matrix) */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary block">
            Ajouter à
          </span>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] border border-[color:var(--panel-border)] cursor-pointer transition">
              <input
                type="checkbox"
                checked={channel.includeInHeadphones}
                onChange={() => toggleChannelRouting(channel.id, "headphones")}
                className="accent-[#0A84FF] h-4 w-4 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-[color:var(--text-primary)]">
                Ajouter au mix personnel (Casque)
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] border border-[color:var(--panel-border)] cursor-pointer transition">
              <input
                type="checkbox"
                checked={channel.includeInStream}
                onChange={() => toggleChannelRouting(channel.id, "stream")}
                className="accent-[#0A84FF] h-4 w-4 rounded cursor-pointer"
              />
              <span className="text-xs font-medium text-[color:var(--text-primary)]">
                Ajouter au mix de stream (OBS)
              </span>
            </label>
          </div>
        </div>

        {/* Raccourcis Matrix (Personnel & Stream Columns) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-tertiary">
            <span>Raccourcis</span>
            <Info className="w-3 h-3 text-tertiary" />
          </div>

          {/* Table Grid: Column Headers */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-secondary pb-1">
            <span className="text-center">Personnel</span>
            <span className="text-center">Stream</span>
          </div>

          {/* Row 1: Volume Down */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Volume1 className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("headphoneVolDown", channel.shortcuts.headphoneVolDown)}
              </div>
              <div className="flex items-center gap-1.5">
                <Volume1 className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("streamVolDown", channel.shortcuts.streamVolDown)}
              </div>
            </div>
          </div>

          {/* Row 2: Volume Up */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("headphoneVolUp", channel.shortcuts.headphoneVolUp)}
              </div>
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("streamVolUp", channel.shortcuts.streamVolUp)}
              </div>
            </div>
          </div>

          {/* Row 3: Mute Toggle */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("headphoneMute", channel.shortcuts.headphoneMute)}
              </div>
              <div className="flex items-center gap-1.5">
                <VolumeX className="w-3.5 h-3.5 text-secondary shrink-0" />
                {renderKeybox("streamMute", channel.shortcuts.streamMute)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => openChannelSettings(null)}
            className="w-full py-2 bg-[#0A84FF] text-white font-semibold text-xs rounded-xl shadow-md hover:bg-[#0077EE] transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
