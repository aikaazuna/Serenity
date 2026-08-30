import { useEffect } from "react";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerChannelId } from "@/types/mixer";
import type { MixerGlobalShortcutBinding, OverlayNotificationItem } from "@shared/types";

export function useMixerShortcuts() {
  const channels = useMixerStore((s) => s.channels);
  const mixerEnabled = useMixerStore((s) => s.mixerEnabled);
  const adjustVolumeStep = useMixerStore((s) => s.adjustVolumeStep);
  const toggleMuteWithHud = useMixerStore((s) => s.toggleMuteWithHud);
  const selectedChannelSettings = useMixerStore((s) => s.selectedChannelSettings);

  // 1. Sync global shortcuts with Electron process (runs across all Windows games & apps)
  useEffect(() => {
    if (!mixerEnabled) return;
    const bindings: MixerGlobalShortcutBinding[] = [];

    for (const chId of Object.keys(channels) as MixerChannelId[]) {
      const ch = channels[chId];
      const sc = ch.shortcuts;

      if (sc.headphoneVolUp) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "headphone", action: "volUp", accelerator: sc.headphoneVolUp });
      }
      if (sc.headphoneVolDown) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "headphone", action: "volDown", accelerator: sc.headphoneVolDown });
      }
      if (sc.headphoneMute) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "headphone", action: "mute", accelerator: sc.headphoneMute });
      }
      if (sc.streamVolUp) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "stream", action: "volUp", accelerator: sc.streamVolUp });
      }
      if (sc.streamVolDown) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "stream", action: "volDown", accelerator: sc.streamVolDown });
      }
      if (sc.streamMute) {
        bindings.push({ channelId: chId, channelName: ch.name, channelColor: ch.color, target: "stream", action: "mute", accelerator: sc.streamMute });
      }
    }

    if ((window as any).serenity?.mixer?.registerShortcuts) {
      void (window as any).serenity.mixer.registerShortcuts(bindings);
    }
    // Cleanup: unregister shortcuts when mixer disabled or component unmounts
    return () => {
      if ((window as any).serenity?.mixer?.unregisterShortcuts) {
        void (window as any).serenity.mixer.unregisterShortcuts();
      }
    };
  }, [channels, mixerEnabled]);

  // 2. Listen to global shortcuts fired from background by Electron
  useEffect(() => {
    if ((window as any).serenity?.mixer?.onShortcutAction) {
      const unsub = (window as any).serenity.mixer.onShortcutAction((payload: { channelId: MixerChannelId; target: "headphone" | "stream"; action: "volUp" | "volDown" | "mute" }) => {
        if (payload.action === "volUp") {
          adjustVolumeStep(payload.channelId, payload.target, 5);
        } else if (payload.action === "volDown") {
          adjustVolumeStep(payload.channelId, payload.target, -5);
        } else if (payload.action === "mute") {
          toggleMuteWithHud(payload.channelId, payload.target);
        }
      });
      return () => unsub();
    }
    return undefined;
  }, [adjustVolumeStep, toggleMuteWithHud]);

  // 3. Local keydown listener when Serenity window is focused
  useEffect(() => {
    if (selectedChannelSettings) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let keyName = e.key;
      if (keyName === " ") keyName = "Space";
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (!["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        parts.push(keyName);
        const pressedCombo = parts.join("+").toLowerCase();

        const matchedItems: OverlayNotificationItem[] = [];

        for (const chId of Object.keys(channels) as MixerChannelId[]) {
          const ch = channels[chId];
          const sc = ch.shortcuts;

          if (sc.headphoneVolUp && sc.headphoneVolUp.toLowerCase() === pressedCombo) {
            e.preventDefault();
            adjustVolumeStep(chId, "headphone", 5);
            matchedItems.push({
              id: `${chId}-headphone`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "headphone",
              volume: Math.min(100, ch.headphoneVolume + 5),
              isMuted: ch.headphoneMuted,
              actionType: "up",
            });
          } else if (sc.headphoneVolDown && sc.headphoneVolDown.toLowerCase() === pressedCombo) {
            e.preventDefault();
            adjustVolumeStep(chId, "headphone", -5);
            matchedItems.push({
              id: `${chId}-headphone`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "headphone",
              volume: Math.max(0, ch.headphoneVolume - 5),
              isMuted: ch.headphoneMuted,
              actionType: "down",
            });
          } else if (sc.headphoneMute && sc.headphoneMute.toLowerCase() === pressedCombo) {
            e.preventDefault();
            toggleMuteWithHud(chId, "headphone");
            matchedItems.push({
              id: `${chId}-headphone`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "headphone",
              volume: ch.headphoneVolume,
              isMuted: !ch.headphoneMuted,
              actionType: "mute",
            });
          }

          if (sc.streamVolUp && sc.streamVolUp.toLowerCase() === pressedCombo) {
            e.preventDefault();
            adjustVolumeStep(chId, "stream", 5);
            matchedItems.push({
              id: `${chId}-stream`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "stream",
              volume: Math.min(100, ch.streamVolume + 5),
              isMuted: ch.streamMuted,
              actionType: "up",
            });
          } else if (sc.streamVolDown && sc.streamVolDown.toLowerCase() === pressedCombo) {
            e.preventDefault();
            adjustVolumeStep(chId, "stream", -5);
            matchedItems.push({
              id: `${chId}-stream`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "stream",
              volume: Math.max(0, ch.streamVolume - 5),
              isMuted: ch.streamMuted,
              actionType: "down",
            });
          } else if (sc.streamMute && sc.streamMute.toLowerCase() === pressedCombo) {
            e.preventDefault();
            toggleMuteWithHud(chId, "stream");
            matchedItems.push({
              id: `${chId}-stream`,
              channelId: chId,
              channelName: ch.name,
              channelColor: ch.color,
              target: "stream",
              volume: ch.streamVolume,
              isMuted: !ch.streamMuted,
              actionType: "mute",
            });
          }
        }

        // Trigger system-wide composite Electron overlay window if multiple channels matched
        if (matchedItems.length > 1 && (window as any).serenity?.overlay?.show) {
          (window as any).serenity.overlay.show({
            type: "volume",
            items: matchedItems,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [channels, adjustVolumeStep, toggleMuteWithHud, selectedChannelSettings]);
}
