import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Mic2,
  Gamepad2,
  Music,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export const MixerPage: React.FC = () => {
  const t = useI18n();

  const [tracks, setTracks] = useState([
    { id: "master", name: "Master", volume: 100, muted: false, icon: Volume2, color: "#0A84FF", label: t.mixer.masterTrack },
    { id: "gaming", name: "Gaming", volume: 85, muted: false, icon: Gamepad2, color: "#30D158", label: t.mixer.gameTrack },
    { id: "discord", name: "Discord", volume: 90, muted: false, icon: Mic2, color: "#BF5AF2", label: t.mixer.discordTrack },
    { id: "music", name: "Media", volume: 65, muted: false, icon: Music, color: "#FF9F0A", label: t.mixer.musicTrack },
  ]);

  const updateVolume = (id: string, val: number) => {
    setTracks((prev) =>
      prev.map((tr) => (tr.id === id ? { ...tr, volume: val } : tr))
    );
  };

  const toggleMute = (id: string) => {
    setTracks((prev) =>
      prev.map((tr) => (tr.id === id ? { ...tr, muted: !tr.muted } : tr))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 pb-16 select-none max-w-5xl mx-auto w-full"
    >
      {/* Workstation Teaser Header */}
      <div className="apple-card p-6 sm:p-7 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0A84FF]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              {t.mixer.sectionSubtitle}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#0A84FF] bg-[#0A84FF]/10 px-2.5 py-0.5 rounded-md">
            {t.mixer.roadmapBadge}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[color:var(--text-primary)] tracking-tight">
          {t.mixer.title}
        </h1>

        <p className="text-xs text-secondary max-w-3xl leading-relaxed">
          {t.mixer.desc}
        </p>
      </div>

      {/* Interactive Faders Console */}
      <div className="apple-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.mixer.previewTitle}
            </h3>
          </div>
          <span className="text-xs text-tertiary">{t.mixer.interactiveSim}</span>
        </div>

        {/* Faders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tracks.map((track) => {
            const Icon = track.icon;
            const effectiveVol = track.muted ? 0 : track.volume;

            return (
              <div
                key={track.id}
                className="apple-inner-box p-4 rounded-2xl flex flex-col justify-between space-y-4 transition hover:border-[color:var(--panel-border-strong)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${track.color}20`, color: track.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[color:var(--text-primary)] truncate">
                      {track.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMute(track.id)}
                    className={`p-1 rounded-lg transition cursor-pointer ${
                      track.muted
                        ? "bg-red-500/20 text-red-500"
                        : "text-secondary hover:text-[color:var(--text-primary)]"
                    }`}
                    title={track.muted ? "Rétablir le son" : "Couper le son"}
                  >
                    {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Level Meter & Slider */}
                <div className="h-36 bg-black/15 dark:bg-black/30 rounded-xl flex items-center justify-between px-3 relative overflow-hidden">
                  <div
                    className="absolute bottom-0 inset-x-0 opacity-20 transition-all duration-150"
                    style={{
                      height: `${effectiveVol}%`,
                      backgroundColor: track.color,
                    }}
                  />

                  {/* Vertical Range Slider */}
                  <div className="w-full flex items-center justify-center z-10">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={effectiveVol}
                      disabled={track.muted}
                      onChange={(e) => updateVolume(track.id, Number(e.target.value))}
                      className="h-28 w-2 appearance-none bg-transparent cursor-pointer [writing-mode:bt-lr] [-webkit-appearance:slider-vertical] accent-[#0A84FF]"
                    />
                  </div>
                </div>

                {/* Level Display & Subtitle */}
                <div className="space-y-1 text-center">
                  <span
                    className="font-mono text-xs font-bold block"
                    style={{ color: track.muted ? "var(--text-tertiary)" : track.color }}
                  >
                    {track.muted ? "MUTE" : `${track.volume}%`}
                  </span>
                  <span className="text-[10.5px] text-tertiary block truncate">
                    {track.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature1Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature1Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Headphones className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature2Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature2Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature3Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature3Desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
