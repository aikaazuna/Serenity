import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMixerStore } from "@/state/mixerStore";
import type { MixerChannelId, MixerApp } from "@/types/mixer";
import { Activity, LayoutGrid, Settings, Power, RefreshCw, Plus, X, ArrowRightLeft } from "lucide-react";
import { InteractiveCurveRenderer } from "@/components/audio/InteractiveCurveRenderer";
import { ParametricEQ } from "@/components/audio/ParametricEQ";
import { GraphicEQ } from "@/components/audio/GraphicEQ";
import { AudioEffectsRack } from "@/components/audio/AudioEffectsRack";
import { useAudioStore } from "@/state/audioStore";
import { nanoid } from "nanoid";

export const ChannelInspector: React.FC<{ channelId: MixerChannelId }> = ({ channelId }) => {
  const channel = useMixerStore((s) => s.channels[channelId]);
  const channels = useMixerStore((s) => s.channels);
  const toggleChannelDsp = useMixerStore((s) => s.toggleChannelDsp);
  const unassignedApps = useMixerStore((s) => s.unassignedApps);
  const assignApp = useMixerStore((s) => s.assignApp);
  const unassignApp = useMixerStore((s) => s.unassignApp);
  const syncWindowsAudioSessions = useMixerStore((s) => s.syncWindowsAudioSessions);
  
  // Default to 'routing' as requested by the user
  const [activeTab, setActiveTab] = useState<"routing" | "studio" | "settings">("routing");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customAppName, setCustomAppName] = useState("");
  
  const eqMode = useAudioStore((s) => s.mode);

  if (!channel) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncWindowsAudioSessions();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleAddManualApp = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAppName.trim();
    if (!trimmed) return;

    const newApp: MixerApp = {
      id: `app-custom-${nanoid(6)}`,
      name: trimmed,
      executable: trimmed.toLowerCase().endsWith(".exe") ? trimmed : `${trimmed}.exe`,
      color: channel.color,
      badgeBg: `${channel.color}22`,
      badgeText: channel.color,
    };

    assignApp(channelId, newApp);
    setCustomAppName("");
  };

  // Collect all other apps currently assigned to other channels
  const otherAssignedApps: { app: MixerApp; fromChannelId: MixerChannelId; fromChannelName: string }[] = [];
  for (const chKey of Object.keys(channels) as MixerChannelId[]) {
    if (chKey !== channelId) {
      for (const a of channels[chKey].assignedApps) {
        otherAssignedApps.push({
          app: a,
          fromChannelId: chKey,
          fromChannelName: channels[chKey].name,
        });
      }
    }
  }

  return (
    <div className="apple-card mt-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm flex flex-col min-h-[520px] overflow-hidden">
      {/* Header Bar with Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[color:var(--panel-border)] p-4 bg-[color:var(--panel-bg-strong)]">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-sm" 
            style={{ backgroundColor: channel.color }} 
          />
          <div>
            <h2 className="text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
              Inspecteur : {channel.name}
            </h2>
            <span className="text-[11px] text-secondary">
              {channel.assignedApps.length} application(s) routée(s) vers ce canal
            </span>
          </div>
        </div>

        {/* Tab Navigation: Apps & Routage FIRST */}
        <div className="flex items-center gap-1.5 p-1 bg-[color:var(--panel-bg)] rounded-xl border border-[color:var(--panel-border)]">
          {[
            { id: "routing", label: "Apps & Routage", icon: LayoutGrid },
            { id: "studio", label: "Studio Audio (EQ)", icon: Activity },
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
              {/* Section 1: Assigned Apps on this Channel */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[color:var(--text-primary)]">
                      Applications assignées à {channel.name}
                    </h3>
                    <p className="text-xs text-secondary">
                      Le son de ces applications est contrôlé par le curseur <strong>{channel.name}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRefresh}
                    title="Scanner les applications Windows en cours"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0A84FF]" : "text-secondary"}`} />
                    <span>Actualiser</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {channel.assignedApps.length > 0 ? (
                    channel.assignedApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-[color:var(--panel-border-strong)] transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                            style={{ backgroundColor: `${channel.color}20`, color: channel.color }}
                          >
                            {app.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[color:var(--text-primary)] truncate block">
                              {app.name}
                            </span>
                            <span className="text-[10px] font-mono text-tertiary truncate block">
                              {app.executable || app.name}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => unassignApp(channelId, app.id)}
                          title={`Retirer ${app.name} de ${channel.name}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 transition cursor-pointer shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-6 border border-dashed border-[color:var(--panel-border-strong)] rounded-2xl text-center text-xs text-tertiary flex flex-col items-center gap-2">
                      <LayoutGrid className="w-6 h-6 opacity-40" />
                      <span>Aucune application n'est actuellement assignée à la piste <strong>{channel.name}</strong>.</span>
                      <span className="text-[11px] opacity-75">Sélectionnez une application ci-dessous pour la lier à ce canal.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Add Manual Application */}
              <div className="p-4 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-bg-strong)]">
                <form onSubmit={handleAddManualApp} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customAppName}
                      onChange={(e) => setCustomAppName(e.target.value)}
                      placeholder="Ajouter une application par nom (ex: cs2, valorant, chrome, spotify, discord)..."
                      className="w-full h-9 px-3.5 text-xs rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] text-[color:var(--text-primary)] focus:outline-none focus:border-[#0A84FF] transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!customAppName.trim()}
                    className="h-9 px-4 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter à {channel.name}</span>
                  </button>
                </form>
              </div>

              {/* Section 3: Discovered / Available Applications to Route */}
              <div className="pt-4 border-t border-[color:var(--panel-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[color:var(--text-primary)]">
                    Applications actives détectées sur Windows
                  </h3>
                  <span className="text-[11px] text-tertiary">
                    Cliquez sur une application pour la déplacer vers <strong>{channel.name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 1. Unassigned apps */}
                  {unassignedApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => assignApp(channelId, app)}
                      className="p-3 border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] hover:border-[#30D158]/50 rounded-xl flex items-center justify-between text-left transition cursor-pointer group shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-semibold text-[color:var(--text-primary)] group-hover:text-[#30D158] transition-colors truncate block">
                          {app.name}
                        </span>
                        <span className="text-[10px] text-tertiary">Non assignée</span>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-[#30D158]/15 text-[#30D158] shrink-0 flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>Assigner</span>
                      </span>
                    </button>
                  ))}

                  {/* 2. Apps from other channels (can be moved in 1 click) */}
                  {otherAssignedApps.map(({ app, fromChannelName }) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => assignApp(channelId, app)}
                      className="p-3 border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] hover:border-[#0A84FF]/50 rounded-xl flex items-center justify-between text-left transition cursor-pointer group shadow-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-semibold text-[color:var(--text-primary)] group-hover:text-[#0A84FF] transition-colors truncate block">
                          {app.name}
                        </span>
                        <span className="text-[10px] text-tertiary">
                          Actuellement sur <strong className="text-secondary">{fromChannelName}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-[#0A84FF]/15 text-[#0A84FF] shrink-0 flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Déplacer</span>
                      </span>
                    </button>
                  ))}

                  {unassignedApps.length === 0 && otherAssignedApps.length === 0 && (
                    <div className="col-span-full p-4 border border-dashed border-[color:var(--panel-border)] rounded-xl text-center text-xs text-tertiary">
                      Toutes les applications détectées sont déjà dans cette piste.
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

              <div className={channel.eqEnabled ? "opacity-100 transition-opacity space-y-6" : "opacity-40 pointer-events-none transition-opacity space-y-6"}>
                <InteractiveCurveRenderer />
                <div>
                  <AudioEffectsRack />
                </div>
                <div>
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
                Configuration des touches d'accès rapide pour le canal {channel.name}.
              </p>
              <div className="p-4 border border-[color:var(--panel-border)] rounded-xl bg-[color:var(--panel-bg)] flex flex-col gap-2">
                <span className="text-sm font-semibold">Contrôles clavier / macro</span>
                <span className="text-xs text-tertiary">
                  Les raccourcis pour ajuster le volume ou couper le son s'appliquent en tâche de fond même en plein jeu.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
