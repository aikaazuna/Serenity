import React, { useState, useRef, useEffect } from "react";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerTab } from "@/types/mixer";
import { useI18n } from "@/hooks/useI18n";
import {
  Sliders,
  Gamepad2,
  Mic2,
  Music,
  Radio,
  Mic,
  Settings,
  Tv,
  Power,
} from "lucide-react";

export const MixerTopNav: React.FC = () => {
  const t = useI18n();
  const mixerEnabled = useMixerStore((s) => s.mixerEnabled);
  const toggleMixerEnabled = useMixerStore((s) => s.toggleMixerEnabled);
  const activeTab = useMixerStore((s) => s.activeTab);
  const setActiveTab = useMixerStore((s) => s.setActiveTab);
  const streamerMode = useMixerStore((s) => s.streamerMode);
  const toggleStreamerMode = useMixerStore((s) => s.toggleStreamerMode);
  const resetMixer = useMixerStore((s) => s.resetMixer);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const tabs: { id: MixerTab; label: string; icon: React.ElementType; color: string }[] = [
    { id: "mixer", label: "Mixer", icon: Sliders, color: "#0A84FF" },
    { id: "studio", label: "Studio", icon: Settings, color: "#FF2D55" },
    { id: "game", label: "Game", icon: Gamepad2, color: "#30D158" },
    { id: "chat", label: "Chat", icon: Mic2, color: "#00A6FB" },
    { id: "media", label: "Média", icon: Music, color: "#FF2D55" },
    { id: "aux", label: "Aux", icon: Radio, color: "#BF5AF2" },
    { id: "mic", label: "Micro", icon: Mic, color: "#FF9F0A" },
  ];

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[color:var(--card-border)] pb-3 select-none">
      {/* 1. Left Side: Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-[color:var(--panel-bg)] rounded-xl border border-[color:var(--panel-border)] shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0A84FF] text-white shadow-sm font-bold"
                  : "text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: isActive ? "#ffffff" : tab.color }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Right Side: Master Mixer Power Switch & Streamer Mode */}
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {/* Global Mixer ON / OFF Power Switch */}
        <button
          type="button"
          onClick={toggleMixerEnabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition shadow-xs ${
            mixerEnabled
              ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
              : "bg-neutral-500/10 border-neutral-500/25 text-neutral-400"
          }`}
          title={mixerEnabled ? "Désactiver le mixer audio" : "Activer le mixer audio"}
        >
          <Power className="w-3.5 h-3.5" />
          <span>Mixer : {mixerEnabled ? "ON" : "OFF"}</span>
        </button>

        {/* Streamer Mode Pill Toggle */}
        <button
          type="button"
          onClick={toggleStreamerMode}
          className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition shadow-xs ${
            streamerMode
              ? "bg-[#0A84FF]/15 border-[#0A84FF]/40 text-[#0A84FF]"
              : "bg-[color:var(--panel-bg)] border-[color:var(--panel-border)] text-secondary hover:text-[color:var(--text-primary)]"
          }`}
          title={t.mixer.streamerModeDesc}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>{t.mixer.streamerMode}</span>
          <div
            className={`w-7 h-4 rounded-full p-0.5 transition-colors ${
              streamerMode ? "bg-[#0A84FF]" : "bg-neutral-400 dark:bg-neutral-600"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                streamerMode ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </div>
        </button>

        {/* Options Settings Cog */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="apple-inner-box flex h-8 w-8 items-center justify-center rounded-xl text-secondary hover:text-[color:var(--text-primary)] cursor-pointer transition shadow-xs"
          title={t.mixer.settings}
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Options Dropdown Popover */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-2xl shadow-2xl p-2 z-[300] backdrop-blur-2xl animate-fade-in space-y-1">
            <div className="px-3 py-2 border-b border-[color:var(--panel-border)] flex items-center justify-between">
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {t.mixer.streamerMode}
              </span>
              <input
                type="checkbox"
                checked={streamerMode}
                onChange={toggleStreamerMode}
                className="accent-[#0A84FF] h-4 w-4 cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                resetMixer();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer transition text-left"
            >
              <Power className="w-4 h-4 text-red-400" />
              <span>Réinitialiser la console</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
