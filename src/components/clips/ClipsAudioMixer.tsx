import React, { useState } from "react";
import { Film, Video, Mic, Gamepad2, Mic2, Music, Zap, Play, Pause, Save, CheckCircle2 } from "lucide-react";

export const ClipsAudioMixer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(18);
  const [replayActive, setReplayActive] = useState(true);
  const [savedBanner, setSavedBanner] = useState(false);

  // Track recording include flags
  const [clipTracks, setClipTracks] = useState({
    game: { enabled: true, vol: 100, label: "Piste Jeu (Game Audio)", color: "#30D158", icon: Gamepad2 },
    mic: { enabled: true, vol: 100, label: "Microphone (Voix Joueur)", color: "#FF9F0A", icon: Mic },
    chat: { enabled: true, vol: 90, label: "Chat Vocal (Discord / Teams)", color: "#0A84FF", icon: Mic2 },
    media: { enabled: false, vol: 70, label: "Musique de fond (Spotify)", color: "#BF5AF2", icon: Music },
  });

  const toggleTrack = (key: keyof typeof clipTracks) => {
    setClipTracks((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const setTrackVol = (key: keyof typeof clipTracks, vol: number) => {
    setClipTracks((prev) => ({
      ...prev,
      [key]: { ...prev[key], vol },
    }));
  };

  const handleInstantClip = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const formatSeconds = (sec: number) => {
    const s = Math.round(sec);
    return `00:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <div className="apple-card p-5 sm:p-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm rounded-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[color:var(--panel-border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shadow-xs">
            <Film className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
                Mixeur Audio Clips & Replays
              </h3>
              <span className="text-[10px] font-mono font-bold text-[#BF5AF2] bg-[#BF5AF2]/10 px-2 py-0.5 rounded-md">
                Multi-Pistes Isolé
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Contrôlez les pistes audio capturées séparément dans vos clips et enregistrements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setReplayActive((r) => !r)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-xs ${
              replayActive
                ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                : "bg-neutral-500/10 border-neutral-500/25 text-neutral-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Replay Buffer : {replayActive ? "Actif (30s)" : "Inactif"}</span>
          </button>

          <button
            type="button"
            onClick={handleInstantClip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#BF5AF2] hover:bg-[#a844dc] text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder le Replay</span>
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3 bg-[#30D158]/15 border border-[#30D158]/30 rounded-xl flex items-center gap-2 text-xs font-bold text-[#30D158]">
          <CheckCircle2 className="w-4 h-4" />
          <span>Clip sauvegardé avec succès avec les pistes audio isolées !</span>
        </div>
      )}

      {/* 2-Column Workstation: Left is Track Configuration, Right is Video Timeline Scrubber */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Track Volume & Isolation Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">
            Routage des pistes enregistrées
          </span>

          <div className="space-y-2.5">
            {(Object.keys(clipTracks) as (keyof typeof clipTracks)[]).map((key) => {
              const tr = clipTracks[key];
              const Icon = tr.icon;
              return (
                <div
                  key={key}
                  className={`apple-inner-box p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    tr.enabled
                      ? "bg-[color:var(--panel-bg)] border-[color:var(--panel-border)]"
                      : "bg-neutral-500/5 border-neutral-500/15 opacity-50"
                  }`}
                >
                  {/* Track Icon & Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTrack(key)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: tr.enabled ? `${tr.color}25` : "rgba(128,128,128,0.15)",
                      color: tr.enabled ? tr.color : "gray",
                    }}
                    title={tr.enabled ? "Désactiver de l'enregistrement" : "Activer dans l'enregistrement"}
                  >
                    <Icon className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[color:var(--text-primary)] truncate">
                        {tr.label}
                      </span>
                      <span className="text-[11px] font-mono text-tertiary">
                        {tr.enabled ? `${tr.vol}%` : "EXCLU"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      disabled={!tr.enabled}
                      value={tr.vol}
                      onChange={(e) => setTrackVol(key, Number(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer accent-[#BF5AF2] bg-neutral-200 dark:bg-white/10"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTrack(key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer shrink-0 ${
                      tr.enabled
                        ? "bg-[#30D158]/15 border-[#30D158]/30 text-[#30D158]"
                        : "bg-neutral-500/10 border-neutral-500/20 text-neutral-400"
                    }`}
                  >
                    {tr.enabled ? "Inclus" : "Exclu"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Timeline Waveform & Video Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between apple-inner-box p-4 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-bg-strong)] space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                Aperçu du buffer Replay
              </span>
              <span className="text-[10px] font-mono font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-md">
                1080p 60 FPS • AV1
              </span>
            </div>

            {/* Video Canvas Box */}
            <div className="h-28 bg-black/40 rounded-lg flex items-center justify-center border border-white/5 relative overflow-hidden">
              <div className="flex flex-col items-center gap-1.5 text-tertiary">
                <Video className="w-6 h-6 opacity-60" />
                <span className="text-[11px] font-medium">Flux vidéo prêt pour capture</span>
              </div>

              <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
                <span className="font-mono text-[10px] font-bold text-white/90 bg-black/60 px-1.5 py-0.5 rounded">
                  {formatSeconds(playheadPos)} / 00:30
                </span>
              </div>
            </div>
          </div>

          {/* Mini multi-track waveforms */}
          <div className="space-y-1.5 pt-1">
            <div className="relative flex items-center mb-2">
              <input
                type="range"
                min={0}
                max={30}
                step={0.1}
                value={playheadPos}
                onChange={(e) => setPlayheadPos(Number(e.target.value))}
                className="w-full accent-[#BF5AF2] h-1.5 bg-black/20 dark:bg-black/50 rounded-full cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-10 text-tertiary">Jeu</span>
              <div className="h-2 flex-1 bg-[#30D158]/20 rounded overflow-hidden">
                <div className="h-full bg-[#30D158]/70 w-[85%] rounded" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-10 text-tertiary">Micro</span>
              <div className="h-2 flex-1 bg-[#FF9F0A]/20 rounded overflow-hidden">
                <div className="h-full bg-[#FF9F0A]/70 w-[60%] rounded" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="w-10 text-tertiary">Chat</span>
              <div className="h-2 flex-1 bg-[#0A84FF]/20 rounded overflow-hidden">
                <div className="h-full bg-[#0A84FF]/70 w-[70%] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
