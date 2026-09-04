import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Play,
  Trash2,
  FolderOpen,
  Copy,
  RefreshCw,
  Camera,
  Calendar,
  HardDrive,
  Sparkles,
} from "lucide-react";
import { useClipsStore } from "@/state/clipsStore";
import { useAppStore } from "@/state/appStore";
import { ClipsAudioMixer } from "@/components/clips/ClipsAudioMixer";
import { ClipVideoPlayerModal } from "@/components/clips/ClipVideoPlayerModal";
import { ScreenshotViewerModal } from "@/components/clips/ScreenshotViewerModal";
import type { ClipItem } from "@shared/types";

export const ClipsPage: React.FC = () => {
  const items = useClipsStore((s) => s.items);
  const filter = useClipsStore((s) => s.filter);
  const setFilter = useClipsStore((s) => s.setFilter);
  const loadFiles = useClipsStore((s) => s.loadFiles);
  const isLoading = useClipsStore((s) => s.isLoading);
  const deleteFile = useClipsStore((s) => s.deleteFile);
  const openFolder = useClipsStore((s) => s.openFolder);
  const setSelectedClip = useClipsStore((s) => s.setSelectedClip);
  const setSelectedScreenshot = useClipsStore((s) => s.setSelectedScreenshot);
  const saveReplay = useClipsStore((s) => s.saveReplay);
  const takeScreenshot = useClipsStore((s) => s.takeScreenshot);
  const replayDuration = useClipsStore((s) => s.replayDuration);
  const settings = useAppStore((s) => s.settings);
  const notify = useAppStore((s) => s.notify);

  const replayShortcut = settings.clips?.replayShortcut || "Alt+F10";
  const screenshotShortcut = settings.clips?.screenshotShortcut || "Alt+F1";

  // Load files on mount and listen to background events
  useEffect(() => {
    void loadFiles();

    // Listen to background triggers
    const unsubs: (() => void)[] = [];
    if ((window as any).serenity?.clips?.onReplayTriggered) {
      const u1 = (window as any).serenity.clips.onReplayTriggered(() => {
        void saveReplay().then(() => void loadFiles()).catch(console.error);
      });
      unsubs.push(u1);
    }
    if ((window as any).serenity?.clips?.onScreenshotTriggered) {
      const u2 = (window as any).serenity.clips.onScreenshotTriggered((item: ClipItem) => {
        if (item) {
          useClipsStore.setState((state) => ({
            items: [item, ...state.items.filter((i) => i.id !== item.id)],
          }));
        }
      });
      unsubs.push(u2);
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, [loadFiles, saveReplay]);

  const videoCount = items.filter((i) => i.type === "video").length;
  const screenshotCount = items.filter((i) => i.type === "screenshot").length;

  const filteredItems = items.filter((i) => {
    if (filter === "video") return i.type === "video";
    if (filter === "screenshot") return i.type === "screenshot";
    return true;
  });

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${Math.round(kb)} KB`;
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    notify("Chemin copié dans le presse-papiers", "success");
  };

  const handleDelete = async (item: ClipItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer ${item.filename} ?`)) {
      const ok = await deleteFile(item.path);
      if (ok) {
        notify("Fichier supprimé", "info");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 pb-20 select-none max-w-6xl mx-auto w-full"
    >
      {/* 1. Multi-Track Workstation & Quick Action Controls */}
      <ClipsAudioMixer />

      {/* 2. Media Gallery Section */}
      <div className="apple-card p-5 sm:p-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm rounded-3xl space-y-5">
        {/* Gallery Header & Tab Switcher */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[color:var(--panel-border)] pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
              Galerie des Enregistrements ({items.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="apple-inner-box flex items-center p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  filter === "all"
                    ? "bg-[#0A84FF] text-white shadow-xs"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                Tous ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("video")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  filter === "video"
                    ? "bg-[#BF5AF2] text-white shadow-xs"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                Clips ({videoCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter("screenshot")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  filter === "screenshot"
                    ? "bg-[#30D158] text-white shadow-xs"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                Captures ({screenshotCount})
              </button>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => void loadFiles()}
              className={`apple-inner-box p-2 text-secondary hover:text-[color:var(--text-primary)] rounded-xl transition cursor-pointer ${
                isLoading ? "animate-spin" : ""
              }`}
              title="Rafraîchir la galerie"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Open Folder in Windows */}
            <button
              type="button"
              onClick={() => void openFolder()}
              className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] rounded-xl transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Ouvrir dans l'Explorateur</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-[#BF5AF2]/10 text-[#BF5AF2] flex items-center justify-center shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-[color:var(--text-primary)]">
              Aucun enregistrement pour le moment
            </h4>
            <p className="text-xs text-secondary max-w-sm">
              Utilisez <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">{replayShortcut}</kbd> pour sauvegarder un Replay {replayDuration}s ou <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">{screenshotShortcut}</kbd> pour une capture instantanée.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => void takeScreenshot()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre une capture ({screenshotShortcut})</span>
              </button>
              <button
                type="button"
                onClick={() => void saveReplay()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#BF5AF2] hover:bg-[#a844dc] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Sauvegarder un Replay ({replayShortcut})</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isVid = item.type === "video";
              const imgSrc = `file:///${item.path.replace(/\\/g, "/")}`;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isVid) setSelectedClip(item);
                    else setSelectedScreenshot(item);
                  }}
                  className="apple-inner-box rounded-2xl overflow-hidden border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:border-[#0A84FF]/50 transition-all group cursor-pointer flex flex-col shadow-xs"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
                    {isVid ? (
                      <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black/80 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-black/60 group-hover:bg-[#BF5AF2] text-white flex items-center justify-center transition-all scale-100 group-hover:scale-110 shadow-lg">
                          <Play className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.thumbnailDataUrl || imgSrc}
                        alt={item.filename}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md ${
                          isVid
                            ? "bg-[#BF5AF2]/80 text-white"
                            : "bg-[#30D158]/80 text-white"
                        }`}
                      >
                        {isVid ? "CLIP" : "CAPTURE"}
                      </span>
                    </div>

                    {/* Bottom Duration / Resolution Badge */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-white bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                        {isVid ? (item.durationSeconds ? `${item.durationSeconds}s` : "30s") : (item.resolution || "PNG")}
                      </span>
                    </div>
                  </div>

                  {/* Card Info Footer */}
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[color:var(--text-primary)] truncate group-hover:text-[#0A84FF] transition" title={item.filename}>
                        {item.filename}
                      </h4>
                      <div className="flex items-center justify-between text-[10.5px] text-tertiary mt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {formatSize(item.sizeBytes)}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar on Hover */}
                    <div className="pt-2 border-t border-[color:var(--panel-border)] flex items-center justify-between opacity-80 group-hover:opacity-100 transition">
                      <span className="text-[10.5px] text-secondary font-medium">
                        {isVid ? "Lire la vidéo" : "Agrandir"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPath(item.path);
                          }}
                          className="p-1 text-tertiary hover:text-[color:var(--text-primary)] rounded-md transition cursor-pointer"
                          title="Copier le chemin"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item, e)}
                          className="p-1 text-tertiary hover:text-red-400 rounded-md transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Modals for Video Player and Screenshot Viewer */}
      <ClipVideoPlayerModal />
      <ScreenshotViewerModal />
    </motion.div>
  );
};
