import React, { useEffect, useState } from "react";
import { useMixerStore } from "@/state/mixerStore";
import { Headphones, Radio, ChevronDown, Check } from "lucide-react";
import { isElectron } from "@/lib/utils";

export const MixerDeviceSelector: React.FC = () => {
  const headphoneDevice = useMixerStore((s) => s.headphoneOutputDevice);
  const streamDevice = useMixerStore((s) => s.streamOutputDevice);
  const setHeadphoneOutput = useMixerStore((s) => s.setHeadphoneOutput);
  const setStreamOutput = useMixerStore((s) => s.setStreamOutput);

  const [deviceList, setDeviceList] = useState<string[]>([
    "Casque (Par défaut)",
    "Haut-parleurs (Realtek Audio)",
    "Buds3 de Raphael",
    "SteelSeries Sonar - Gaming",
    "VB-Audio Virtual Cable",
  ]);

  const [headphoneMenuOpen, setHeadphoneMenuOpen] = useState(false);
  const [streamMenuOpen, setStreamMenuOpen] = useState(false);

  useEffect(() => {
    if (isElectron() && (window as any).serenity?.audio?.getAudioDevices) {
      void (window as any).serenity.audio.getAudioDevices().then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          const names = res
            .map((d: any) => (typeof d === "string" ? d : d.name))
            .filter((n: string) => n && n !== "Toutes les sorties audio");
          if (names.length > 0) {
            setDeviceList(Array.from(new Set(names)));
          }
        }
      });
    }
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 select-none">
      {/* 1. Headphone Listening Device Picker */}
      <div className="relative">
        <div className="apple-inner-box p-3 rounded-2xl border border-[color:var(--card-border-inner)] bg-[color:var(--panel-bg)] hover:border-[color:var(--panel-border-strong)] transition space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-secondary">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Périphérique d'écoute (Casque)</span>
            </div>
            <span className="text-[10px] text-tertiary font-mono">Personnel</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setHeadphoneMenuOpen((o) => !o);
              setStreamMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[color:var(--card-bg)] hover:bg-[color:var(--panel-bg-strong)] border border-[color:var(--panel-border)] text-xs font-semibold text-[color:var(--text-primary)] transition cursor-pointer shadow-sm"
          >
            <span className="truncate max-w-[280px]">{headphoneDevice}</span>
            <ChevronDown className="w-3.5 h-3.5 text-secondary shrink-0 ml-1.5" />
          </button>
        </div>

        {headphoneMenuOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-full bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-2xl shadow-2xl p-1.5 z-[300] backdrop-blur-2xl animate-fade-in max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {deviceList.map((dev) => (
              <button
                key={dev}
                onClick={() => {
                  setHeadphoneOutput(dev);
                  setHeadphoneMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  headphoneDevice === dev
                    ? "bg-[#0A84FF]/15 text-[#0A84FF] font-semibold"
                    : "text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)]"
                }`}
              >
                <span className="truncate">{dev}</span>
                {headphoneDevice === dev && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Stream OBS Output Device Picker */}
      <div className="relative">
        <div className="apple-inner-box p-3 rounded-2xl border border-[color:var(--card-border-inner)] bg-[color:var(--panel-bg)] hover:border-[color:var(--panel-border-strong)] transition space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-secondary">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#30D158]" />
              <span>Périphérique de diffusion (Stream / OBS)</span>
            </div>
            <span className="text-[10px] text-tertiary font-mono">Live</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setStreamMenuOpen((o) => !o);
              setHeadphoneMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[color:var(--card-bg)] hover:bg-[color:var(--panel-bg-strong)] border border-[color:var(--panel-border)] text-xs font-semibold text-[color:var(--text-primary)] transition cursor-pointer shadow-sm"
          >
            <span className="truncate max-w-[280px]">{streamDevice}</span>
            <ChevronDown className="w-3.5 h-3.5 text-secondary shrink-0 ml-1.5" />
          </button>
        </div>

        {streamMenuOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-full bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-2xl shadow-2xl p-1.5 z-[300] backdrop-blur-2xl animate-fade-in max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {deviceList.map((dev) => (
              <button
                key={dev}
                onClick={() => {
                  setStreamOutput(dev);
                  setStreamMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  streamDevice === dev
                    ? "bg-[#30D158]/15 text-[#30D158] font-semibold"
                    : "text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)]"
                }`}
              >
                <span className="truncate">{dev}</span>
                {streamDevice === dev && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
