import React from "react";
import { useMixerStore } from "@/state/mixerStore";
import { MixerChannelStrip } from "./MixerChannelStrip";
import { ChatMixControl } from "./ChatMixControl";
import { MixerDeviceSelector } from "./MixerDeviceSelector";
import type { MixerChannelId } from "@/types/mixer";

export const MixerConsole: React.FC = () => {
  const channels = useMixerStore((s) => s.channels);
  const channelIds: MixerChannelId[] = ["master", "game", "chat", "media", "aux", "mic"];

  return (
    <div className="space-y-4 select-none">
      {/* Top Device Routing Selector Bar */}
      <MixerDeviceSelector />

      {/* 6-Channel Console Strip (Side-by-Side Professional DAW Layout) */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin snap-x">
        {channelIds.map((id) => {
          const channel = channels[id];
          if (!channel) return null;
          return <MixerChannelStrip key={id} channel={channel} />;
        })}
      </div>

      {/* Hardware-like ChatMix Slider */}
      <ChatMixControl />
    </div>
  );
};
