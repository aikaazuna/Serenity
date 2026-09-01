import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { useAudioStore } from '@/state/audioStore';
import { useAppStore } from '@/state/appStore';
import { EQEngine } from '@/lib/eq-engine';
import { isElectron } from '@/lib/utils';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Copy,
  Wrench,
} from 'lucide-react';

export const AudioProfilesPage: React.FC = () => {
  const t = useI18n();
  const audioState = useAudioStore();
  const notify = useAppStore((s) => s.notify);

  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [apoInstalled, setApoInstalled] = useState<boolean | null>(null);
  const [apoPath, setApoPath] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    try {
      // @ts-ignore
      if (isElectron() && window.serenity && window.serenity.audio) {
        // @ts-ignore
        window.serenity.audio.checkApoInstalled().then((res: boolean) => {
          if (isMounted) setApoInstalled(res);
        }).catch(() => {});
        // @ts-ignore
        window.serenity.audio.getApoPath().then((p: string) => {
          if (isMounted) setApoPath(p);
        }).catch(() => {});
      }
    } catch {}

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    audioState.saveCustomPreset(newProfileName.trim(), newProfileDesc.trim());
    notify(`Profil « ${newProfileName} » enregistré avec succès`, 'success');
    setNewProfileName('');
    setNewProfileDesc('');
  };

  const handleApplyProfile = (preset: any) => {
    audioState.applyPreset(preset);
    notify(`Profil « ${preset.name} » chargé`, 'success');
  };

  const handleExportApoConfig = () => {
    const configString = EQEngine.generateConfig(audioState);
    const blob = new Blob([configString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serenity-config-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Fichier de configuration APO téléchargé', 'success');
  };

  const copyConfigToClipboard = () => {
    const configString = EQEngine.generateConfig(audioState);
    navigator.clipboard.writeText(configString);
    notify('Configuration copiée dans le presse-papiers', 'success');
  };

  const handleAutoEQImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      let newPreamp = audioState.preamp ?? 0;
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
        audioState.setParametricFilters(newFilters);
        audioState.setPreamp(newPreamp);
        audioState.setMode('parametric');
        
        const profileName = file.name.replace(/\.txt$/i, '');
        audioState.saveCustomPreset(profileName, 'Importé depuis AutoEQ');
        notify(`Profil AutoEQ « ${profileName} » importé et enregistré !`, 'success');
      } else {
        notify('Format AutoEQ non reconnu dans le fichier', 'warning');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generatedApoConfig = EQEngine.generateConfig(audioState);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 pb-12 select-none"
    >
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
          {t.audioProfiles.title}
        </h2>
        <p className="text-xs text-secondary mt-1">
          {t.audioProfiles.subtitle}
        </p>
      </div>

      {/* APO Status Card with Clean Flex Alignment */}
      <div className="apple-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              apoInstalled
                ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                : 'bg-amber-500/20 text-amber-500'
            }`}
          >
            {apoInstalled ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[color:var(--text-primary)]">
              {apoInstalled ? t.audioProfiles.apoActive : t.audioProfiles.apoStatus}
            </h4>
            <p className="text-[11.5px] text-tertiary truncate max-w-xl">
              {apoInstalled
                ? `Synchronisation automatique active vers : ${apoPath || 'config.txt'}`
                : t.audioProfiles.apoMissing}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (isElectron() && window.serenity?.audio?.openDeviceSelector) {
                window.serenity.audio.openDeviceSelector().then((ok: boolean) => {
                  if (!ok) notify("Configurateur Equalizer APO introuvable", "warning");
                });
              }
            }}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0A84FF] hover:bg-[#0A84FF]/10 transition cursor-pointer"
            title="Ouvrir le sélecteur de périphériques d'Equalizer APO"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Gérer les périphériques</span>
          </button>
          <button
            onClick={copyConfigToClipboard}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copier la config</span>
          </button>
          <button
            onClick={handleExportApoConfig}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-xl shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.audioProfiles.exportTxt}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          {/* Save Profile Form */}
          <form
            onSubmit={handleSaveProfile}
            className="apple-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
              <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
                Sauvegarder le profil actuel
              </h3>
              <span className="text-[11px] text-tertiary">
                Capture le préamp, filtres et rack DSP
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-secondary mb-1">
                  Nom du profil
                </label>
                <input
                  type="text"
                  placeholder="ex: Mon Casque Bluetooth Bass+"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="apple-inner-box w-full px-3 py-2 text-xs text-[color:var(--text-primary)] focus-ring rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-secondary mb-1">
                  Description (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: Réglage équilibré pour écoute nocturne"
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="apple-inner-box w-full px-3 py-2 text-xs text-[color:var(--text-primary)] focus-ring rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAutoEQImport}
                  accept=".txt"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Importer AutoEQ (.txt)</span>
                </button>

                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-xl shadow-sm transition disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </form>

          {/* User Custom Profiles List */}
          <div className="apple-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider border-b border-[color:var(--card-border)] pb-2">
              {t.audioProfiles.myProfiles} ({(audioState.customPresets || []).length})
            </h3>

            {(!audioState.customPresets || audioState.customPresets.length === 0) ? (
              <p className="text-xs text-tertiary py-6 text-center">
                Aucun profil personnalisé pour l’instant.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {audioState.customPresets.map((preset) => {
                  const isActive = audioState.activePresetName === preset.name;

                  return (
                    <div
                      key={preset.id}
                      className={`apple-inner-box flex items-center justify-between p-3 transition ${
                        isActive ? 'border-[#0A84FF] ring-1 ring-[#0A84FF]' : ''
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[280px]">
                        <h4 className="text-xs font-bold text-[color:var(--text-primary)] truncate">
                          {preset.name}
                        </h4>
                        {preset.description && (
                          <p className="text-[11px] text-tertiary truncate">
                            {preset.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApplyProfile(preset)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                            isActive
                              ? 'bg-[#0A84FF] text-white'
                              : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
                          }`}
                        >
                          {isActive ? t.audioProfiles.active : t.audioProfiles.load}
                        </button>

                        <button
                          onClick={() => audioState.deleteCustomPreset(preset.id)}
                          className="p-1.5 text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition cursor-pointer"
                          title="Supprimer ce profil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live config.txt View */}
        <div className="apple-card flex flex-col p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#0A84FF]" />
              <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
                {t.audioProfiles.livePreview}
              </h3>
            </div>
            <span className="text-[10.5px] text-tertiary font-mono">Format Equalizer APO</span>
          </div>

          <pre className="flex-1 p-4 rounded-xl bg-black/85 text-emerald-400 font-mono text-[11.5px] leading-relaxed overflow-auto select-text min-h-[380px] border border-black/30 shadow-inner">
            {generatedApoConfig}
          </pre>
        </div>
      </div>
    </motion.div>
  );
};
