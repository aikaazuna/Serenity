import { useEffect } from "react";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerChannelId } from "@/types/mixer";
import type { MixerGlobalShortcutBinding, MixerChannelVolumeState, OverlayNotificationItem } from "@shared/types";

export function useMixerShortcuts() {
  const channels = useMixerStore((s) => s.channels);
  const mixerEnabled = useMixerStore((s) => s.mixerEnabled);
  const adjustVolumeStep = useMixerStore((s) => s.adjustVolumeStep);
  const toggleMuteWithHud = useMixerStore((s) => s.toggleMuteWithHud);
  const selectedChannelSettings = useMixerStore((s) => s.selectedChannelSettings);

  // 1. Sync global shortcuts and channel volume state with Electron main process
  useEffect(() => {
    if (!mixerEnabled) return;

    const bindings: MixerGlobalShortcutBinding[] = [];
    const states: MixerChannelVolumeState[] = [];

    for (const chId of Object.keys(channels) as MixerChannelId[]) {
      const ch = channels[chId];
      const sc = ch.shortcuts;

      states.push({
        channelId: chId,
        channelName: ch.name,
        channelColor: ch.color,
        headphoneVolume: ch.headphoneVolume,
        streamVolume: ch.streamVolume,
        headphoneMuted: ch.headphoneMuted,
        streamMuted: ch.streamMuted,
        processNames: (ch.assignedApps || []).map((a) => a.name),
      });

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

    if ((window as any).serenity?.mixer?.syncState) {
      void (window as any).serenity.mixer.syncState(states);
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

  // 2. Synchronize Zustand store when shortcuts are pressed while the app is in the background
  useEffect(() => {
    if ((window as any).serenity?.mixer?.onStateUpdated) {
      const unsub = (window as any).serenity.mixer.onStateUpdated(
        ({ channelId, state }: { channelId: MixerChannelId; state: MixerChannelVolumeState }) => {
          useMixerStore.setState((s) => {
            const existing = s.channels[channelId];
            if (!existing) return s;
            return {
              channels: {
                ...s.channels,
                [channelId]: {
                  ...existing,
                  headphoneVolume: state.headphoneVolume,
                  streamVolume: state.streamVolume,
                  headphoneMuted: state.headphoneMuted,
                  streamMuted: state.streamMuted,
                },
              },
            };
          });
        }
      );
      return () => unsub();
    }
    return undefined;
  }, []);

  // 3. Local keydown listener when Serenity window is focused
  useEffect(() => {
    if (!mixerEnabled || selectedChannelSettings) return;

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
  }, [channels, mixerEnabled, adjustVolumeStep, toggleMuteWithHud, selectedChannelSettings]);
}
