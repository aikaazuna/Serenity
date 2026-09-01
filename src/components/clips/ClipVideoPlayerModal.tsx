import React, { useRef, useState, useEffect } from "react";
import { useClipsStore } from "@/state/clipsStore";
import { useAppStore } from "@/state/appStore";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Trash2,
  FolderOpen,
  Copy,
  Film,
} from "lucide-react";

export const ClipVideoPlayerModal: React.FC = () => {
  const selectedClip = useClipsStore((s) => s.selectedClip);
  const setSelectedClip = useClipsStore((s) => s.setSelectedClip);
  const deleteFile = useClipsStore((s) => s.deleteFile);
  const openFolder = useClipsStore((s) => s.openFolder);
  const notify = useAppStore((s) => s.notify);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedClip(null);
      } else if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedClip]);

  if (!selectedClip) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void videoRef.current.requestFullscreen();
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce clip ?")) {
      const ok = await deleteFile(selectedClip.path);
      if (ok) {
        notify("Clip supprimé", "info");
      }
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedClip.path);
    notify("Chemin du fichier copié", "success");
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Construct secure safe local URL
  const videoSrc = `file:///${selectedClip.path.replace(/\\/g, "/")}`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="absolute inset-0"
        onClick={() => setSelectedClip(null)}
      />

      <div className="relative z-10 w-full max-w-4xl bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] truncate">
                {selectedClip.filename}
              </h3>
              <p className="text-[11px] text-tertiary">
                {formatSize(selectedClip.sizeBytes)} • {new Date(selectedClip.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPath}
              className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] rounded-xl transition cursor-pointer"
              title="Copier le chemin"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => void openFolder()}
              className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] rounded-xl transition cursor-pointer"
              title="Ouvrir dans l'Explorateur"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
              title="Supprimer le clip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedClip(null)}
              className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center overflow-hidden group">
          <video
            ref={videoRef}
            src={videoSrc}
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full max-h-[60vh] object-contain cursor-pointer"
            autoPlay
          />

          {/* Big Center Play Button overlay on pause */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all scale-100 hover:scale-110 shadow-2xl cursor-pointer"
            >
              <Play className="w-7 h-7 ml-1 fill-white" />
            </button>
          )}
        </div>

        {/* Custom Video Controls Bar */}
        <div className="p-4 px-5 bg-[color:var(--card-bg)] border-t border-[color:var(--panel-border)] space-y-2 shrink-0">
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-semibold text-secondary min-w-[36px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 rounded-full cursor-pointer accent-[#BF5AF2] bg-neutral-500/25"
            />
            <span className="text-[11px] font-mono font-semibold text-tertiary min-w-[36px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-xl bg-[#BF5AF2] hover:bg-[#a844dc] text-white flex items-center justify-center transition shadow-sm cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-secondary hover:text-[color:var(--text-primary)] rounded-lg transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 rounded-full cursor-pointer accent-[#0A84FF] bg-neutral-500/25"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg)] rounded-xl transition cursor-pointer"
                title="Plein écran"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
