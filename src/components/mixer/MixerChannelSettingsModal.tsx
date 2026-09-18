import React, { useState, useEffect } from "react";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerApp } from "@/types/mixer";
import { nanoid } from "nanoid";
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
  FolderOpen,
  Plus,
  RefreshCw,
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
  const assignApp = useMixerStore((s) => s.assignApp);
  const unassignApp = useMixerStore((s) => s.unassignApp);
  const unassignedApps = useMixerStore((s) => s.unassignedApps);
  const syncWindowsAudioSessions = useMixerStore((s) => s.syncWindowsAudioSessions);

  const [listeningKey, setListeningKey] = useState<string | null>(null);
  const [customAppName, setCustomAppName] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const channel = selectedChannelId ? channels[selectedChannelId] : null;

  const handleBrowseApp = async () => {
    if (!channel || typeof window === "undefined" || !(window as any).serenity?.mixer?.browseApp) return;
    try {
      const selected = await (window as any).serenity.mixer.browseApp();
      if (!selected) return;

      const newApp: MixerApp = {
        id: `app-custom-${nanoid(6)}`,
        name: selected.name,
        executable: selected.executable,
        color: channel.color,
        badgeBg: `${channel.color}22`,
        badgeText: channel.color,
      };

      assignApp(channel.id, newApp);
    } catch (err) {
      console.error("Failed to browse app:", err);
    }
  };

  const handleAddManualApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel) return;
    const trimmed = customAppName.trim();
    if (!trimmed) return;

    const newApp: MixerApp = {
      id: `app-custom-${nanoid(6)}`,
      name: trimmed,
      executable: trimmed.toLowerCase().endsWith(".exe") ? trimmed : `${trimmed}.exe`,
      color: channel.color,
      badgeBg: `${channel.color}22`,
      badgeText: channel.color,
    };

    assignApp(channel.id, newApp);
    setCustomAppName("");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncWindowsAudioSessions();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

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
      <div className="apple-card w-full max-w-md p-6 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-2xl space-y-5 max-h-[88vh] overflow-y-auto">
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

        {/* Applications Routées (Channels other than master) */}
        {channel.id !== "master" && (
          <div className="space-y-3 pt-1 border-t border-[color:var(--panel-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary block">
                Applications assignées ({channel.assignedApps.length})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Actualiser les processus audio"
                  className="p-1 rounded text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0A84FF]" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={handleBrowseApp}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#0A84FF]/10 text-[#0A84FF] hover:bg-[#0A84FF]/20 border border-[#0A84FF]/30 transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Parcourir .exe</span>
                </button>
              </div>
            </div>

            {/* List of assigned apps */}
            <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-[color:var(--panel-bg)] border border-[color:var(--panel-border)]">
              {channel.assignedApps.length === 0 ? (
                <div className="flex items-center justify-center w-full py-2 text-xs text-tertiary">
                  Aucune application assignée à cette piste
                </div>
              ) : (
                channel.assignedApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--panel-border)] text-xs font-medium text-[color:var(--text-primary)] shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                    <span className="truncate max-w-[140px]">{app.name}</span>
                    <button
                      type="button"
                      onClick={() => unassignApp(channel.id, app.id)}
                      className="text-tertiary hover:text-red-400 ml-1 transition"
                      title="Retirer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick add from detected unassigned apps */}
            {unassignedApps.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider block">
                  Applications audio détectées :
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  {unassignedApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => assignApp(channel.id, app)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[color:var(--panel-bg-strong)] hover:bg-[#0A84FF]/20 border border-[color:var(--panel-border)] hover:border-[#0A84FF]/40 text-xs text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
                      title={`Assigner ${app.name} à ${channel.name}`}
                    >
                      <Plus className="w-3 h-3 text-[#0A84FF]" />
                      <span className="truncate max-w-[120px]">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual input */}
            <form onSubmit={handleAddManualApp} className="flex gap-2">
              <input
                type="text"
                value={customAppName}
                onChange={(e) => setCustomAppName(e.target.value)}
                placeholder="Nom du processus (ex: spotify.exe)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[color:var(--panel-bg)] border border-[color:var(--panel-border)] text-xs text-[color:var(--text-primary)] focus:outline-none focus:border-[#0A84FF]"
              />
              <button
                type="submit"
                disabled={!customAppName.trim()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[color:var(--panel-bg-strong)] hover:bg-[#0A84FF] hover:text-white border border-[color:var(--panel-border)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Ajouter
              </button>
            </form>
          </div>
        )}

        {/* Ajouter à (Routing Matrix) */}
        <div className="space-y-2 pt-1 border-t border-[color:var(--panel-border)]">
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
