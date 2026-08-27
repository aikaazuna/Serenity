import React, { useEffect, useState, useRef } from "react";
import { useAudioStore } from "@/state/audioStore";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";
import { isElectron } from "@/lib/utils";
import {
  Speaker,
  RotateCcw,
  Upload,
  Gauge,
  Sliders,
  Power,
  AlertTriangle,
} from "lucide-react";

export const AudioHeader: React.FC = () => {
  const eqEnabled = useAudioStore((s) => s.eqEnabled);
  const toggleEqEnabled = useAudioStore((s) => s.toggleEqEnabled);
  const preamp = useAudioStore((s) => s.preamp) ?? 0;
  const setPreamp = useAudioStore((s) => s.setPreamp);
  const devices = useAudioStore((s) => s.devices) || ["all"];
  const toggleDevice = useAudioStore((s) => s.toggleDevice);
  const channel = useAudioStore((s) => s.channel) || "all";
  const setChannel = useAudioStore((s) => s.setChannel);
  const resetEq = useAudioStore((s) => s.resetEq);
  const setParametricFilters = useAudioStore((s) => s.setParametricFilters);
  const setMode = useAudioStore((s) => s.setMode);
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();

  const [deviceList, setDeviceList] = useState<string[]>([]);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(event.target as Node)
      ) {
        setDeviceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDevices = async () => {
      try {
        // @ts-ignore
        if (isElectron() && window.colorflow?.audio) {
          // @ts-ignore
          const fetchFn = window.colorflow.audio.getAudioDevices || window.colorflow.audio.getDevices;
          if (typeof fetchFn === "function") {
            const raw = await fetchFn();
            if (isMounted && Array.isArray(raw) && raw.length > 0) {
              const names = raw.map((d: any) =>
                typeof d === "string" ? d : d.name || "Périphérique"
              ).filter(Boolean);
              setDeviceList(Array.from(new Set(names)));
              return;
            }
          }
        }

        // Web fallback via navigator.mediaDevices
        if (navigator.mediaDevices?.enumerateDevices) {
          const mediaDevs = await navigator.mediaDevices.enumerateDevices();
          if (isMounted) {
            const outputs = mediaDevs
              .filter((d) => d.kind === "audiooutput" && d.label)
              .map((d) => d.label);
            if (outputs.length > 0) {
              setDeviceList(Array.from(new Set(outputs)));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load audio devices", e);
      }
    };

    void loadDevices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleMenu = () => {
    setDeviceMenuOpen((v) => {
      const next = !v;
      if (next) {
        // Refresh device list immediately on open
        // @ts-ignore
        if (isElectron() && window.colorflow?.audio) {
          // @ts-ignore
          const fetchFn = window.colorflow.audio.getAudioDevices || window.colorflow.audio.getDevices;
          if (typeof fetchFn === "function") {
            void fetchFn().then((raw: any) => {
              if (Array.isArray(raw) && raw.length > 0) {
                const names = raw.map((d: any) =>
                  typeof d === "string" ? d : d.name || "Périphérique"
                ).filter(Boolean);
                setDeviceList(Array.from(new Set(names)));
              }
            });
          }
        }
      }
      return next;
    });
  };

  const handleAutoEQImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      let newPreamp = preamp;
      const preampMatch = content.match(/Preamp:\s*([-\d.]+)\s*dB/i);
      if (preampMatch && preampMatch[1]) {
        newPreamp = parseFloat(preampMatch[1]) || 0;
      }

      const regex =
        /Filter\s+(?:\d+):\s+ON\s+(PK|LS|HS|LP|HP|NO|AP|BP|LSC|HSC|LSQ|HSQ)\s+Fc\s+([\d.]+)\s+Hz\s+Gain\s+([-\d.]+)\s+dB\s+Q\s+([\d.]+)/gi;
      let match;
      const newFilters = [];

      while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[2] && match[3] && match[4]) {
          newFilters.push({
            enabled: true,
            type: match[1],
            freq: parseFloat(match[2]) || 1000,
            gain: parseFloat(match[3]) || 0,
            q: parseFloat(match[4]) || 1.41,
          });
        }
      }

      if (newFilters.length > 0) {
        setParametricFilters(newFilters);
        setPreamp(newPreamp);
        setMode("parametric");
        notify(`Profil AutoEQ importé (${file.name})`, "success");
      } else {
        notify("Format non reconnu", "warning");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isClippingRisk = preamp > 3;

  return (
    <div className="apple-card relative z-30 p-5 select-none space-y-3.5">
      {/* Top Row: Device, Channel on Left; Actions & Master Power on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Device & Channel Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Device Dropdown with Click Toggle & Outside Click Listener */}
          <div className="relative z-50" ref={deviceDropdownRef}>
            <button
              type="button"
              onClick={handleToggleMenu}
              className="apple-inner-box flex h-9 items-center gap-2 px-3 py-1 cursor-pointer hover:border-[color:var(--panel-border-strong)] transition"
              title={t.audio.deviceSelector}
            >
              <Speaker className="h-4 w-4 text-[#0A84FF] shrink-0" />
              <span className="text-xs font-semibold text-[color:var(--text-primary)] max-w-[210px] truncate">
                {devices.includes("all")
                  ? t.audio.allOutputs
                  : `${devices.length} ${t.audio.selectedOutputs}`}
              </span>
            </button>

            {deviceMenuOpen && (
              <div className="absolute top-full mt-2 left-0 w-72 bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-2xl shadow-2xl p-2.5 z-[300] backdrop-blur-2xl animate-fade-in space-y-1">
                <div className="text-[11px] font-bold text-tertiary uppercase tracking-wider px-2 py-1">
                  {t.audio.deviceSelector}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  <label className="flex items-center gap-2.5 p-2 hover:bg-[color:var(--panel-bg-strong)] rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={devices.includes("all")}
                      onChange={() => toggleDevice("all")}
                      className="accent-[#0A84FF] h-4 w-4 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-[color:var(--text-primary)]">
                      {t.audio.allOutputs}
                    </span>
                  </label>
                  {deviceList
                    .filter((d) => d && d !== "all" && d !== "Toutes les sorties audio" && d !== "All Devices")
                    .map((d) => (
                      <label
                        key={d}
                        className="flex items-center gap-2.5 p-2 hover:bg-[color:var(--panel-bg-strong)] rounded-xl cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={devices.includes(d)}
                          onChange={() => toggleDevice(d)}
                          className="accent-[#0A84FF] h-4 w-4 rounded cursor-pointer"
                        />
                        <span className="text-xs font-medium text-[color:var(--text-primary)] truncate" title={d}>
                          {d}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>


          {/* Channel Segmented Control */}
          <div className="apple-inner-box flex h-9 items-center p-1 rounded-xl gap-1">
            <button
              onClick={() => setChannel("all")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                channel === "all"
                  ? "bg-[#0A84FF] text-white shadow-sm"
                  : "text-secondary hover:text-[color:var(--text-primary)]"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{t.audio.allChannels}</span>
            </button>
            <button
              onClick={() => setChannel("L")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                channel === "L"
                  ? "bg-[#0A84FF] text-white shadow-sm"
                  : "text-secondary hover:text-[color:var(--text-primary)]"
              }`}
            >
              {t.audio.leftChannel}
            </button>
            <button
              onClick={() => setChannel("R")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                channel === "R"
                  ? "bg-[#0A84FF] text-white shadow-sm"
                  : "text-secondary hover:text-[color:var(--text-primary)]"
              }`}
            >
              {t.audio.rightChannel}
            </button>
          </div>
        </div>

        {/* Right: AutoEQ, Reset & Master Power Switch */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAutoEQImport}
            accept=".txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="apple-inner-box flex h-9 items-center gap-1.5 px-3 py-1 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.audio.importAutoEq}
          >
            <Upload className="h-3.5 w-3.5 text-[#0A84FF]" />
            <span>AutoEQ</span>
          </button>

          <button
            onClick={resetEq}
            className="apple-inner-box flex h-9 items-center gap-1.5 px-3 py-1 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.audio.reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.audio.reset}</span>
          </button>

          {/* Master Power Toggle Button */}
          <button
            onClick={toggleEqEnabled}
            className={`flex h-9 items-center gap-2 px-3.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer shadow-xs ${
              eqEnabled
                ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                : "bg-neutral-500/10 border-neutral-500/25 text-neutral-400"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            <span>Studio : {eqEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Preamp Slider Full Width Inline */}
      <div className="apple-inner-box flex flex-wrap items-center justify-between gap-4 p-3.5 sm:px-4">
        <div className="flex items-center gap-2 shrink-0">
          <Gauge className={`h-4 w-4 ${isClippingRisk ? "text-amber-500" : "text-[#0A84FF]"}`} />
          <span className="text-xs font-bold text-[color:var(--text-primary)]">
            {t.audio.masterPreamp}
          </span>
          <span className="text-[11px] text-tertiary hidden md:inline">
            (Compensation de saturation APO)
          </span>
        </div>

        <div className="flex-1 max-w-md flex items-center gap-3.5">
          <input
            type="range"
            min="-20"
            max="15"
            step="0.5"
            value={preamp}
            onChange={(e) => setPreamp(parseFloat(e.target.value) || 0)}
            className="w-full h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
          />

          <div
            className={`flex items-center gap-1.5 min-w-[66px] justify-center font-mono text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
              isClippingRisk
                ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                : "apple-inner-box text-[color:var(--text-primary)]"
            }`}
          >
            {isClippingRisk && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
            <span>{preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
