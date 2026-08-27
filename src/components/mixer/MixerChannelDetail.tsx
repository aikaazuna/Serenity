import React, { useState } from "react";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerChannelId } from "@/types/mixer";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Volume2,
  Power,
  Plus,
  Trash2,
  Check,
  X,
  Info,
} from "lucide-react";

interface MixerChannelDetailProps {
  channelId: MixerChannelId;
}

export const MixerChannelDetail: React.FC<MixerChannelDetailProps> = ({ channelId }) => {
  const channel = useMixerStore((s) => s.channels[channelId]);
  const customPresets = useMixerStore((s) => s.customDspPresets[channelId] || []);
  const updateChannelDsp = useMixerStore((s) => s.updateChannelDsp);
  const toggleChannelDsp = useMixerStore((s) => s.toggleChannelDsp);
  const saveCustomPreset = useMixerStore((s) => s.saveCustomPreset);
  const deleteCustomPreset = useMixerStore((s) => s.deleteCustomPreset);
  const setActiveTab = useMixerStore((s) => s.setActiveTab);

  const [createOpen, setCreateOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState("");

  if (!channel) return null;

  const defaultPresetsByChannel: Record<MixerChannelId, string[]> = {
    master: ["Écoute Globale", "Master Diffusion", "Mode Nuit Calme"],
    game: ["Jeux & Pas FPS", "Explosions & Action", "MOBA & Stratégie", "Profil Personnalisé"],
    chat: ["Clarté Voix Discord", "Voix Podcast", "Voix Radio Chaude", "Réduction de bruit max"],
    media: ["Musique & Basses", "Acoustique / Voix", "Cinéma & Films", "Studio Neutre"],
    aux: ["Standard / Alertes", "Boost d'alertes", "Musique de fond (BGM)"],
    mic: ["Voix Chaude Broadcast", "Voix Claire Studio", "Micro Direct", "Pièce Bruyante (Gate)"],
  };

  const allPresets = [
    ...(defaultPresetsByChannel[channelId] || ["Défaut"]),
    ...customPresets.map((p) => p.name),
  ];

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    saveCustomPreset(channelId, presetNameInput.trim());
    setPresetNameInput("");
    setCreateOpen(false);
  };

  const isCurrentCustom = customPresets.some((p) => p.name === channel.currentPreset);
  const currentCustomPreset = customPresets.find((p) => p.name === channel.currentPreset);

  return (
    <div className="space-y-5 select-none">
      {/* 1. Header Banner */}
      <div className="apple-card p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 border border-[color:var(--card-border)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("mixer")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] border border-[color:var(--panel-border)] text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour console</span>
          </button>

          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: channel.color, boxShadow: `0 0 8px ${channel.color}` }}
            />
            <h2 className="text-base font-bold text-[color:var(--text-primary)] tracking-tight">
              Profil & DSP • Canal {channel.name}
            </h2>
          </div>
        </div>

        {/* Preset Selector & Create Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-tertiary">Profil :</span>
          <select
            value={channel.currentPreset}
            onChange={(e) => updateChannelDsp(channelId, { currentPreset: e.target.value })}
            className="apple-inner-box px-3 py-1.5 rounded-xl text-xs font-semibold text-[color:var(--text-primary)] bg-[color:var(--panel-bg)] border border-[color:var(--panel-border)] cursor-pointer outline-none shadow-xs"
          >
            {allPresets.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>

          {/* Delete custom preset button */}
          {isCurrentCustom && currentCustomPreset && (
            <button
              type="button"
              onClick={() => {
                deleteCustomPreset(channelId, currentCustomPreset.id);
                updateChannelDsp(channelId, {
                  currentPreset: defaultPresetsByChannel[channelId]?.[0] || "Défaut",
                });
              }}
              title="Supprimer ce profil personnalisé"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10 border border-red-500/30 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Create new preset button */}
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A84FF]/15 hover:bg-[#0A84FF]/25 border border-[#0A84FF]/40 text-xs font-semibold text-[#0A84FF] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau profil</span>
          </button>
        </div>
      </div>

      {/* Modal / Popover Créer Profil */}
      {createOpen && (
        <div className="apple-card p-4 border border-[#0A84FF]/40 bg-[#0A84FF]/5 rounded-2xl flex items-center justify-between gap-3 flex-wrap animate-fade-in">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-[color:var(--text-primary)]">Nom du profil :</span>
            <input
              type="text"
              placeholder="ex: Mes réglages FPS CS2"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[color:var(--card-bg)] border border-[color:var(--panel-border)] text-xs text-[color:var(--text-primary)] outline-none focus:border-[#0A84FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePreset}
              className="px-3.5 py-1.5 bg-[#0A84FF] text-white rounded-xl text-xs font-bold hover:bg-[#0077EE] transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="w-8 h-8 rounded-xl text-secondary hover:bg-[color:var(--panel-bg-strong)] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. DSP Master Power Toggle & Audio Studio Coexistence Banner */}
      <div className="apple-inner-box p-4 rounded-2xl border border-[color:var(--card-border-inner)] bg-[color:var(--panel-bg)] flex items-center justify-between flex-wrap gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toggleChannelDsp(channelId)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition cursor-pointer ${
              channel.eqEnabled
                ? "bg-[#30D158]/20 border-[#30D158]/50 text-[#30D158] shadow-[0_0_12px_rgba(48,209,88,0.25)]"
                : "bg-neutral-500/15 border-neutral-500/30 text-neutral-400"
            }`}
            title={channel.eqEnabled ? "Désactiver le traitement" : "Activer le traitement"}
          >
            <Power className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {channel.eqEnabled ? "Traitement DSP du canal : Actif" : "Traitement DSP du canal : Désactivé (Pass-through neutre)"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  channel.eqEnabled
                    ? "bg-[#30D158]/15 text-[#30D158]"
                    : "bg-neutral-500/15 text-neutral-500"
                }`}
              >
                {channel.eqEnabled ? "ON" : "BYPASS"}
              </span>
            </div>
            <p className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
              <Info className="w-3 h-3 text-tertiary shrink-0" />
              <span>Coopération Audio Studio : l'égalisation générale globale continue de s'appliquer en sortie.</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleChannelDsp(channelId)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
            channel.eqEnabled
              ? "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/40"
              : "bg-[color:var(--card-bg)] text-secondary border-[color:var(--panel-border)] hover:text-[color:var(--text-primary)]"
          }`}
        >
          {channel.eqEnabled ? "Bypasser le canal" : "Activer le traitement"}
        </button>
      </div>

      {/* 3. DSP Controls Grid (Dimmed when bypassed) */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${
          channel.eqEnabled ? "opacity-100" : "opacity-40 pointer-events-none"
        }`}
      >
        {/* EQ & Tone Controls */}
        <div className="apple-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-2.5">
            <Sparkles className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
              Égalisation & Timbre
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Bass Boost */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-medium">Renfort de basses (Impact)</span>
                <span className="text-[color:var(--text-primary)] font-mono font-bold">+{channel.bassBoost || 0} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={channel.bassBoost || 0}
                onChange={(e) => updateChannelDsp(channelId, { bassBoost: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-black/40 accent-[#0A84FF] cursor-pointer"
              />
            </div>

            {/* Voice Clarity / Footsteps */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-medium">Clarté vocale / Présence</span>
                <span className="text-[color:var(--text-primary)] font-mono font-bold">+{channel.voiceClarity || 0} dB</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={channel.voiceClarity || 0}
                onChange={(e) => updateChannelDsp(channelId, { voiceClarity: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-black/40 accent-[#0A84FF] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dynamics & Noise Suppression */}
        <div className="apple-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-2.5">
            <Zap className="w-4 h-4 text-[#30D158]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
              Dynamique & Suppression
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Noise Gate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-medium">Noise Gate (Suppression de bruit)</span>
                <span className="text-[color:var(--text-primary)] font-mono font-bold">{channel.noiseGate || 0} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={channel.noiseGate || 0}
                onChange={(e) => updateChannelDsp(channelId, { noiseGate: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-black/40 accent-[#30D158] cursor-pointer"
              />
            </div>

            {/* Compressor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary font-medium">Compresseur & Normalisation</span>
                <span className="text-[color:var(--text-primary)] font-mono font-bold">{channel.compressor || 0} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={channel.compressor || 0}
                onChange={(e) => updateChannelDsp(channelId, { compressor: Number(e.target.value) })}
                className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-black/40 accent-[#30D158] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Spatial & Channel Routing */}
        <div className="apple-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-2.5">
            <Volume2 className="w-4 h-4 text-[#BF5AF2]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
              Spatialisation & Routage
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] cursor-pointer transition border border-[color:var(--panel-border)]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[color:var(--text-primary)] block">
                  Spatialisation 7.1 Virtual
                </span>
                <span className="text-[10px] text-tertiary">
                  Améliore la localisation des sons
                </span>
              </div>
              <input
                type="checkbox"
                checked={channel.spatialAudio || false}
                onChange={(e) => updateChannelDsp(channelId, { spatialAudio: e.target.checked })}
                className="accent-[#BF5AF2] h-4 w-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] cursor-pointer transition border border-[color:var(--panel-border)]">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[color:var(--text-primary)] block">
                  Isolation pour le Studio Clips
                </span>
                <span className="text-[10px] text-tertiary">
                  Enregistre ce canal sur sa propre piste audio
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="accent-[#30D158] h-4 w-4 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
