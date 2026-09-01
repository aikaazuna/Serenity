import React, { useState, useEffect } from "react";
import { useClipsStore } from "@/state/clipsStore";
import { useAppStore } from "@/state/appStore";
import {
  X,
  Trash2,
  FolderOpen,
  Copy,
  Download,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

export const ScreenshotViewerModal: React.FC = () => {
  const selectedScreenshot = useClipsStore((s) => s.selectedScreenshot);
  const setSelectedScreenshot = useClipsStore((s) => s.setSelectedScreenshot);
  const deleteFile = useClipsStore((s) => s.deleteFile);
  const openFolder = useClipsStore((s) => s.openFolder);
  const notify = useAppStore((s) => s.notify);

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedScreenshot(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedScreenshot, setSelectedScreenshot]);

  if (!selectedScreenshot) return null;

  const handleDelete = async () => {
    if (window.confirm("Supprimer cette capture d'écran ?")) {
      const ok = await deleteFile(selectedScreenshot.path);
      if (ok) {
        notify("Capture d'écran supprimée", "info");
      }
    }
  };

  const handleCopyImage = async () => {
    try {
      // Copy image blob to clipboard
      const res = await fetch(`file:///${selectedScreenshot.path.replace(/\\/g, "/")}`);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
      notify("Image copiée dans le presse-papiers !", "success");
    } catch {
      // Fallback copy path
      navigator.clipboard.writeText(selectedScreenshot.path);
      notify("Chemin copié dans le presse-papiers", "info");
    }
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(selectedScreenshot.path);
    notify("Chemin du fichier copié", "success");
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb > 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${Math.round(kb)} KB`;
  };

  const imgSrc = `file:///${selectedScreenshot.path.replace(/\\/g, "/")}`;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div
        className="absolute inset-0"
        onClick={() => setSelectedScreenshot(null)}
      />

      <div className="relative z-10 w-full max-w-4xl bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] truncate">
                {selectedScreenshot.filename}
              </h3>
              <p className="text-[11px] text-tertiary">
                {selectedScreenshot.resolution ? `${selectedScreenshot.resolution} • ` : ""}{formatSize(selectedScreenshot.sizeBytes)} • {new Date(selectedScreenshot.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-sm"
              title="Copier l'image"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copier l'image</span>
            </button>
            <button
              onClick={handleCopyPath}
              className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] rounded-xl transition cursor-pointer"
              title="Copier le chemin"
            >
              <Download className="w-4 h-4" />
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
              title="Supprimer la capture"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="p-2 text-secondary hover:text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)] rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Image Area with Zoom Controls */}
        <div className="relative bg-black flex-1 min-h-[360px] flex items-center justify-center overflow-auto p-4">
          <img
            src={imgSrc}
            alt={selectedScreenshot.filename}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="max-w-full max-h-[65vh] object-contain transition-transform duration-150 rounded-lg shadow-2xl"
          />

          {/* Floating Zoom Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-white/90 px-2 min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
