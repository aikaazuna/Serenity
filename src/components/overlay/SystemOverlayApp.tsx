import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OverlayNotificationPayload } from "@shared/types";
import {
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  Gamepad2,
  Mic2,
  Music,
  Radio,
  Mic,
  Film,
  Layers,
} from "lucide-react";

const getChannelIcon = (id?: string) => {
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

export const SystemOverlayApp: React.FC = () => {
  const [notification, setNotification] = useState<OverlayNotificationPayload | null>(null);

  useEffect(() => {
    // 1. Initial data check if window opened with payload
    if ((window as any).colorflow?.overlay?.requestInit) {
      (window as any).colorflow.overlay.requestInit().then((initData: OverlayNotificationPayload | null) => {
        if (initData) setNotification(initData);
      });
    }

    // 2. Listen to live IPC overlay data from Electron
    if ((window as any).colorflow?.overlay?.onData) {
      const unsub = (window as any).colorflow.overlay.onData((payload: OverlayNotificationPayload) => {
        setNotification(payload);
      });
      return () => {
        unsub();
      };
    }
    return undefined;
  }, []);

  // Auto-dismiss timer (2 seconds)
  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification || !notification.items || notification.items.length === 0) {
    return null;
  }

  const isMulti = notification.items.length > 1;
  const firstItem = notification.items[0];

  if (!firstItem) return null;

  return (
    <div className="w-full h-full p-2 flex items-start justify-end pointer-events-none select-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={notification.items.map((i) => `${i.id}-${i.volume}-${i.isMuted}`).join("_")}
          initial={{ opacity: 0, x: 50, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[340px] rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.8)] p-3.5 text-white pointer-events-auto"
        >
          {/* 1. Multiple Actions View (Composite adjustments) */}
          {isMulti ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">Actions multiples</h4>
                  <span className="text-[10px] text-white/60">
                    {notification.items.length} pistes modifiées simultanément
                  </span>
                </div>
              </div>

              {/* List of adjusted channels */}
              <div className="space-y-2">
                {notification.items.map((item) => {
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.channelColor }}
                          />
                          <span className="text-white/80 font-medium truncate">
                            {item.actionType === "up"
                              ? "Volume +"
                              : item.actionType === "down"
                              ? "Volume -"
                              : "Muet"}{" "}
                            | {item.channelName} - {item.target === "headphone" ? "Personnel" : "Stream"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white/90 shrink-0 ml-1">
                          {item.isMuted ? "0%" : `${item.volume}%`}
                        </span>
                      </div>

                      {/* Mini level bar */}
                      <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.isMuted ? 0 : item.volume}%`,
                            backgroundColor: item.isMuted ? "#8E8E93" : item.channelColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : notification.type === "clip" ? (
            /* 2. Clip Capture Notification */
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white tracking-tight">
                  {notification.title || "Clip 30s enregistré !"}
                </h4>
                <p className="text-[11px] text-white/60 truncate">
                  {notification.subtitle || "Audio multi-pistes isolé prêt à l'édition"}
                </p>
              </div>
            </div>
          ) : (
            /* 3. Single Channel Volume HUD */
            <div className="flex items-center gap-3">
              {/* Left Accent Stripe & Channel Icon */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: firstItem.channelColor }}
                />
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: `${firstItem.channelColor}22`,
                    borderColor: `${firstItem.channelColor}44`,
                    color: firstItem.channelColor,
                  }}
                >
                  {React.createElement(getChannelIcon(firstItem.channelId), {
                    className: "w-4 h-4",
                  })}
                </div>
              </div>

              {/* Middle Info & Level Bar */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {firstItem.isMuted ? "Sourdine (Muet)" : "Volume"}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-white/90">
                    {firstItem.isMuted ? "0%" : `${firstItem.volume}%`}
                  </span>
                </div>

                <div className="text-[11px] text-white/65 truncate font-medium">
                  {firstItem.channelName} - {firstItem.target === "headphone" ? "Personnel 🎧" : "Stream 📡"}
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${firstItem.isMuted ? 0 : firstItem.volume}%`,
                      backgroundColor: firstItem.isMuted ? "#8E8E93" : firstItem.channelColor,
                      boxShadow: firstItem.isMuted ? undefined : `0 0 8px ${firstItem.channelColor}`,
                    }}
                  />
                </div>
              </div>

              {/* Right Action Badge */}
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/80 shrink-0">
                {firstItem.isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : firstItem.actionType === "down" ? (
                  <Volume1 className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#30D158]" />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
