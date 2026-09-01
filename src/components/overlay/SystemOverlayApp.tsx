import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OverlayNotificationPayload, OverlayNotificationItem } from "@shared/types";
import {
  Volume2,
  Sliders,
  Gamepad2,
  Mic2,
  Music,
  Radio,
  Mic,
  MicOff,
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
  const [isOpen, setIsOpen] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNewPayload = (payload: OverlayNotificationPayload) => {
    if (!payload) return;
    if (payload.type !== "clip" && (!payload.items || payload.items.length === 0)) return;
    setNotification(payload);
    setIsOpen(true);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    const durationMs = Math.max(1000, Math.round((payload.settings?.durationSeconds ?? 2) * 1000));
    dismissTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, durationMs);
  };

  useEffect(() => {
    // 1. Initial data check if window opened with payload
    if ((window as any).serenity?.overlay?.requestInit) {
      (window as any).serenity.overlay
        .requestInit()
        .then((initData: OverlayNotificationPayload | null) => {
          if (initData) handleNewPayload(initData);
        })
        .catch(() => {});
    }

    // 2. Listen to live IPC overlay data from Electron
    if ((window as any).serenity?.overlay?.onData) {
      const unsub = (window as any).serenity.overlay.onData((payload: OverlayNotificationPayload) => {
        handleNewPayload(payload);
      });
      return () => {
        unsub();
      };
    }
    return undefined;
  }, []);

  const firstItem: OverlayNotificationItem = notification?.items?.[0] || {
    id: "default",
    channelName: notification?.title || "",
    channelColor: "#0A84FF",
    target: "headphone",
    volume: 100,
    isMuted: false,
    actionType: "set",
  };
  const isMulti = Boolean(notification && notification.items && notification.items.length > 1);
  const overlayTheme = notification?.settings?.theme || "glass";

  // Distinct Theme Styles
  const getThemeProps = () => {
    if (overlayTheme === "oled") {
      return {
        cardStyle: {
          background: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15)",
        },
        textColor: "#ffffff",
        subColor: "rgba(255, 255, 255, 0.50)",
        trackBg: "rgba(255, 255, 255, 0.14)",
      };
    }
    if (overlayTheme === "frost") {
      return {
        cardStyle: {
          background: "rgba(244, 246, 252, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.95)",
          boxShadow: "inset 0 1px 0 #ffffff, 0 2px 8px rgba(0, 0, 0, 0.12)",
        },
        textColor: "#121217",
        subColor: "rgba(0, 0, 0, 0.55)",
        trackBg: "rgba(0, 0, 0, 0.12)",
      };
    }
    // Flou translucide / Apple Glassmorphism (Default)
    return {
      cardStyle: {
        background: "rgba(18, 18, 24, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.20), 0 2px 8px rgba(0, 0, 0, 0.40)",
      },
      textColor: "#ffffff",
      subColor: "rgba(255, 255, 255, 0.55)",
      trackBg: "rgba(255, 255, 255, 0.14)",
    };
  };

  const themeProps = getThemeProps();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "16px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        boxSizing: "border-box",
        background: "transparent",
        backgroundColor: "transparent",
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <AnimatePresence>
        {isOpen && notification && (firstItem || notification.type === "clip") && (
          <motion.div
            key="serenity-hud-card"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              ...themeProps.cardStyle,
              width: "328px",
              borderRadius: "18px",
              padding: "12px 14px",
              color: themeProps.textColor,
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          >
            {/* 1. Multi Actions View (2+ channels adjusted simultaneously) */}
            {isMulti ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderBottom: `1px solid ${overlayTheme === "frost" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.10)"}`,
                    paddingBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(10, 132, 255, 0.2)",
                      border: "1px solid rgba(10, 132, 255, 0.4)",
                      color: "#0A84FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Layers style={{ width: "14px", height: "14px" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "-0.01em" }}>
                      Actions multiples
                    </div>
                    <div style={{ fontSize: "10px", color: themeProps.subColor }}>
                      {(notification.items ?? []).length} pistes modifiées simultanément
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(notification.items ?? []).map((item) => (
                    <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              backgroundColor: item.isMuted ? "#636366" : item.channelColor,
                              boxShadow: item.isMuted ? undefined : `0 0 6px ${item.channelColor}`,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontWeight: 600, color: themeProps.textColor, textOverflow: "ellipsis", overflow: "hidden" }}>
                            {item.channelName} • {item.target === "headphone" ? "Casque" : "Stream"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, marginLeft: "6px" }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              fontSize: "11px",
                              color: item.isMuted ? themeProps.subColor : themeProps.textColor,
                            }}
                          >
                            {item.volume}%
                          </span>
                          {item.isMuted && (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 4px",
                                borderRadius: "3px",
                                backgroundColor: "rgba(255, 69, 58, 0.2)",
                                color: "#FF453A",
                                border: "1px solid rgba(255, 69, 58, 0.4)",
                              }}
                            >
                              MUET
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: "5px",
                          borderRadius: "999px",
                          backgroundColor: themeProps.trackBg,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${item.volume}%`,
                            backgroundColor: item.isMuted ? "#636366" : item.channelColor,
                            boxShadow: item.isMuted ? undefined : `0 0 6px ${item.channelColor}`,
                            borderRadius: "999px",
                            transition: "width 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : notification.type === "mic" ? (
              /* 2. Dedicated Microphone Status HUD */
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: firstItem.isMuted ? "rgba(255, 69, 58, 0.18)" : "rgba(48, 209, 88, 0.18)",
                    border: `1px solid ${firstItem.isMuted ? "rgba(255, 69, 58, 0.4)" : "rgba(48, 209, 88, 0.4)"}`,
                    color: firstItem.isMuted ? "#FF453A" : "#30D158",
                    boxShadow: `0 0 12px ${firstItem.isMuted ? "rgba(255, 69, 58, 0.25)" : "rgba(48, 209, 88, 0.25)"}`,
                  }}
                >
                  {firstItem.isMuted ? (
                    <MicOff style={{ width: "18px", height: "18px" }} />
                  ) : (
                    <Mic style={{ width: "18px", height: "18px" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: themeProps.textColor }}>
                      {firstItem.isMuted ? "Microphone Coupé" : "Microphone Actif"}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: "4px",
                        backgroundColor: firstItem.isMuted ? "rgba(255, 69, 58, 0.2)" : "rgba(48, 209, 88, 0.2)",
                        border: `1px solid ${firstItem.isMuted ? "rgba(255, 69, 58, 0.35)" : "rgba(48, 209, 88, 0.35)"}`,
                        color: firstItem.isMuted ? "#FF453A" : "#30D158",
                      }}
                    >
                      {firstItem.isMuted ? "MUET" : "ON AIR"}
                    </span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: themeProps.subColor, marginTop: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {firstItem.isMuted ? "Votre voix n'est plus diffusée" : "Transmission audio en direct"}
                  </div>
                </div>
              </div>
            ) : notification.type === "clip" ? (
              /* 3. Clip Replay Notification */
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor: "rgba(255, 55, 95, 0.18)",
                    border: "1px solid rgba(255, 55, 95, 0.4)",
                    color: "#FF375F",
                    boxShadow: "0 0 12px rgba(255, 55, 95, 0.25)",
                  }}
                >
                  <Film style={{ width: "18px", height: "18px" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: themeProps.textColor }}>
                      {notification.title || "Clip 30s enregistré !"}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: "4px",
                        backgroundColor: "rgba(255, 55, 95, 0.2)",
                        border: "1px solid rgba(255, 55, 95, 0.35)",
                        color: "#FF375F",
                      }}
                    >
                      REPLAY
                    </span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: themeProps.subColor, marginTop: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {notification.subtitle || "Audio multi-pistes isolé prêt à l'édition"}
                  </div>
                </div>
              </div>
            ) : (
              /* 4. Single Track Apple Volume HUD (Standard) */
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Top Row: Track Icon + Title + Value Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {/* Left: Track Icon Box */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      backgroundColor: `${firstItem.channelColor}22`,
                      border: `1px solid ${firstItem.channelColor}45`,
                      color: firstItem.channelColor,
                      boxShadow: `0 0 10px ${firstItem.channelColor}25`,
                    }}
                  >
                    {React.createElement(getChannelIcon(firstItem.channelId), {
                      style: { width: "16px", height: "16px" },
                    })}
                  </div>

                  {/* Right: Title + Volume on Line 1, Subtitle on Line 2 */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 700,
                          color: themeProps.textColor,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {firstItem.channelName}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: firstItem.isMuted ? themeProps.subColor : themeProps.textColor,
                            letterSpacing: "-0.02em",
                            lineHeight: 1,
                          }}
                        >
                          {firstItem.volume}%
                        </span>
                        {firstItem.isMuted && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              padding: "1px 5px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 69, 58, 0.2)",
                              border: "1px solid rgba(255, 69, 58, 0.4)",
                              color: "#FF453A",
                              letterSpacing: "0.02em",
                              lineHeight: 1,
                            }}
                          >
                            MUET
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "10.5px",
                        color: themeProps.subColor,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {firstItem.target === "headphone" ? "Personnel (Casque)" : "Stream (OBS)"}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: LED Glow Progress Bar */}
                <div
                  style={{
                    width: "100%",
                    height: "5px",
                    borderRadius: "999px",
                    backgroundColor: themeProps.trackBg,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${firstItem.volume}%`,
                      backgroundColor: firstItem.isMuted ? "#636366" : firstItem.channelColor,
                      boxShadow: firstItem.isMuted ? undefined : `0 0 6px ${firstItem.channelColor}`,
                      borderRadius: "999px",
                      transition: "width 0.12s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
