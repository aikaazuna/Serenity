import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerChannelId } from "@/types/mixer";
import { Activity, LayoutGrid, Settings, Power } from "lucide-react";
import { InteractiveCurveRenderer } from "@/components/audio/InteractiveCurveRenderer";
import { ParametricEQ } from "@/components/audio/ParametricEQ";
import { GraphicEQ } from "@/components/audio/GraphicEQ";
import { AudioEffectsRack } from "@/components/audio/AudioEffectsRack";
import { useAudioStore } from "@/state/audioStore";

export const ChannelInspector: React.FC<{ channelId: MixerChannelId }> = ({ channelId }) => {
  const channel = useMixerStore((s) => s.channels[channelId]);
  const toggleChannelDsp = useMixerStore((s) => s.toggleChannelDsp);
  const unassignedApps = useMixerStore((s) => s.unassignedApps);
  const assignApp = useMixerStore((s) => s.assignApp);
  const unassignApp = useMixerStore((s) => s.unassignApp);
  const [activeTab, setActiveTab] = useState<"routing" | "studio" | "settings">("studio");
  
  const eqMode = useAudioStore((s) => s.mode);

  if (!channel) return null;

  return (
    <div className="apple-card mt-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm flex flex-col min-h-[500px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--panel-border)] p-4 bg-[color:var(--panel-bg-strong)]">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-sm" 
            style={{ backgroundColor: channel.color }} 
          />
          <h2 className="text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
            Inspecteur : {channel.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 p-1 bg-[color:var(--panel-bg)] rounded-xl border border-[color:var(--panel-border)]">
          {[
            { id: "routing", label: "Apps & Routage", icon: LayoutGrid },
            { id: "studio", label: "Studio Audio", icon: Activity },
            { id: "settings", label: "Raccourcis", icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0A84FF] text-white shadow-sm"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "routing" && (
            <motion.div 
              key="routing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold">Applications de ce canal</h3>
                <p className="text-xs text-secondary mt-1">
                  Ces applications sont liées à {channel.name}. Cliquez pour les retirer.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {channel.assignedApps.length > 0 ? (
                    channel.assignedApps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => unassignApp(channelId, app.id)}
                        className="p-3 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 rounded-xl flex items-center justify-between text-left transition cursor-pointer group"
                      >
                        <span className="text-xs font-semibold truncate group-hover:text-red-500 transition-colors">{app.name}</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full p-4 border border-dashed border-[color:var(--panel-border-strong)] rounded-xl text-center text-xs text-tertiary">
                      Aucune application assignée à ce canal.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[color:var(--panel-border)]">
                <h3 className="text-sm font-bold">Applications non assignées</h3>
                <p className="text-xs text-secondary mt-1">
                  Cliquez sur une application pour l'ajouter à {channel.name}.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {unassignedApps.length > 0 ? (
                    unassignedApps.map(app => (
                      <button
                        key={app.id}
                        onClick={() => assignApp(channelId, app)}
                        className="p-2.5 border border-[color:var(--panel-border)] bg-[color:var(--panel-bg-strong)] hover:bg-[color:var(--panel-bg)] hover:border-[#30D158]/50 rounded-xl flex items-center justify-between text-left transition cursor-pointer group"
                      >
                        <span className="text-xs font-medium truncate group-hover:text-[#30D158] transition-colors">{app.name}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 group-hover:bg-[#30D158] shrink-0" />
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full p-4 border border-dashed border-[color:var(--panel-border-strong)] rounded-xl text-center text-xs text-tertiary">
                      Toutes les applications détectées sont déjà assignées.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "studio" && (
            <motion.div 
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold">Studio Audio (EQ)</h3>
                  <span className="text-xs text-secondary">Sculptez le son du canal {channel.name} indépendamment</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleChannelDsp(channelId)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs cursor-pointer ${
                    channel.eqEnabled
                      ? "bg-[#30D158]/20 border-[#30D158]/40 text-[#30D158]"
                      : "bg-neutral-500/15 border-neutral-500/25 text-neutral-400"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>DSP : {channel.eqEnabled ? "ON" : "OFF"}</span>
                </button>
              </div>

              <div className={channel.eqEnabled ? "opacity-100 transition-opacity" : "opacity-40 pointer-events-none transition-opacity"}>
                <InteractiveCurveRenderer />
                <div className="mt-6">
                  <AudioEffectsRack />
                </div>
                <div className="mt-6">
                  {eqMode === "parametric" ? <ParametricEQ /> : <GraphicEQ />}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold">Raccourcis</h3>
              <p className="text-xs text-secondary">
                Configuration des macros pour le canal {channel.name}.
              </p>
              <div className="p-4 border border-[color:var(--panel-border)] rounded-xl bg-[color:var(--panel-bg)] flex flex-col gap-2">
                <span className="text-sm font-semibold">Boutons matériels / Clavier</span>
                <span className="text-xs text-tertiary">
                  Les raccourcis pour Mute/Volume Up/Volume Down seront affichés ici.
                </span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
