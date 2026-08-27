import React from "react";
import { useMixerStore } from "@/state/mixerStore";
import { MixerChannelStrip } from "./MixerChannelStrip";
import type { MixerChannelId } from "@/types/mixer";

interface MixerConsoleProps {
  selectedChannelId: MixerChannelId;
  onSelectChannel: (id: MixerChannelId) => void;
}

export const MixerConsole: React.FC<MixerConsoleProps> = ({ selectedChannelId, onSelectChannel }) => {
  const channels = useMixerStore((s) => s.channels);
  const channelIds: MixerChannelId[] = ["master", "game", "chat", "media", "aux", "mic"];

  return (
    <div className="space-y-4 select-none">
      {/* 6-Channel Console Strip */}
      <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-thin snap-x">
        {channelIds.map((id) => {
          const channel = channels[id];
          if (!channel) return null;
          return (
            <MixerChannelStrip 
              key={id} 
              channel={channel} 
              isSelected={selectedChannelId === id}
              onSelect={() => onSelectChannel(id)}
            />
          );
        })}
      </div>
    </div>
  );
};
