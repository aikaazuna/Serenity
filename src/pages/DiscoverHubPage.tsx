import React from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@/state/uiStore';
import { useAppStore } from '@/state/appStore';
import { useAudioStore } from '@/state/audioStore';
import { startPicker } from '@/hooks/usePickerBridge';
import { useClipboard } from '@/hooks/useClipboard';
import {
  Pipette,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Sliders,
  Headphones,
  Volume2,
  Bookmark,
  ArrowRight,
  Power,
  Copy,
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export const DiscoverHubPage: React.FC = () => {
  const t = useI18n();
  const setActivePage = useUiStore((s) => s.setActivePage);
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const eqEnabled = useAudioStore((s) => s.eqEnabled);
  const toggleEqEnabled = useAudioStore((s) => s.toggleEqEnabled);
  const activePresetName = useAudioStore((s) => s.activePresetName);
  const preamp = useAudioStore((s) => s.preamp) ?? 0;
  const { copy } = useClipboard();

  const quickTools = [
    {
      id: 'color',
      title: t.nav.color,
      desc: t.hub.tools.colorDesc,
      icon: Pipette,
      color: '#0A84FF',
      action: () => setActivePage('color'),
    },
    {
      id: 'audio-eq',
      title: t.nav.audioEq,
      desc: t.hub.tools.audioDesc,
      icon: Sliders,
      color: '#30D158',
      action: () => setActivePage('audio-eq'),
    },
    {
      id: 'audio-presets',
      title: t.nav.audioPresets,
      desc: t.hub.tools.presetsDesc,
      icon: Headphones,
      color: '#BF5AF2',
      action: () => setActivePage('audio-presets'),
    },
    {
      id: 'gradients',
      title: t.nav.gradients,
      desc: t.hub.tools.gradientsDesc,
      icon: Sparkles,
      color: '#FF9F0A',
      action: () => setActivePage('gradients'),
    },
    {
      id: 'image-extract',
      title: t.nav.imageExtract,
      desc: t.hub.tools.imageDesc,
      icon: ImageIcon,
      color: '#64D2FF',
      action: () => setActivePage('image-extract'),
    },
    {
      id: 'accessibility',
      title: t.nav.accessibility,
      desc: t.hub.tools.accessibilityDesc,
      icon: Eye,
      color: '#FF375F',
      action: () => setActivePage('accessibility'),
    },
    {
      id: 'audio-lab',
      title: t.nav.audioLab,
      desc: t.hub.tools.labDesc,
      icon: Volume2,
      color: '#5E5CE6',
      action: () => setActivePage('audio-lab'),
    },
    {
      id: 'library',
      title: t.nav.library,
      desc: t.hub.tools.libraryDesc,
      icon: Bookmark,
      color: '#FFD60A',
      action: () => setActivePage('library'),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-16 select-none">
      {/* Featured Apple Style Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Banner 1: Color Studio */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121829] via-[#0b0e17] to-black p-7 shadow-2xl flex flex-col justify-between min-h-[220px]"
        >
          <div
            className="absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: activeColorHex }}
          />

          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A84FF]">
              {t.hub.featuredColor}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
              {t.hub.colorTitle}
            </h2>
            <p className="text-xs text-gray-300 max-w-[340px] leading-relaxed">
              {t.hub.colorDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 relative z-10">
            <button
              onClick={() => void startPicker()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl shadow-lg hover:bg-white/90 transition active:scale-95 cursor-pointer"
            >
              <Pipette className="w-3.5 h-3.5" />
              <span>{t.hub.launchPicker}</span>
            </button>

            <button
              onClick={() => setActivePage('color')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition cursor-pointer"
            >
              <span>{t.hub.openInspector}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Banner 2: Audio Studio */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12241b] via-[#09150f] to-black p-7 shadow-2xl flex flex-col justify-between min-h-[220px]"
        >
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-500 blur-3xl opacity-25 pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {t.hub.featuredAudio}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
              {t.hub.audioTitle}
            </h2>
            <p className="text-xs text-gray-300 max-w-[340px] leading-relaxed">
              {t.hub.audioDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 relative z-10">
            <button
              onClick={() => setActivePage('audio-eq')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg hover:bg-emerald-300 transition active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t.hub.openAudioStudio}</span>
            </button>

            <button
              onClick={() => setActivePage('audio-presets')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition cursor-pointer"
            >
              <span>{t.hub.autoEqPresets}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Live Status Cards (Laser Aligned Symmetrical Grid with Uniform gap-5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Color Status Card */}
        <div className="apple-card flex items-center justify-between p-4.5 sm:px-5 sm:py-4.5 min-h-[88px] gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-2xl border border-black/15 dark:border-white/20 shadow-md shrink-0 flex items-center justify-center transition-all"
              style={{ backgroundColor: activeColorHex }}
            >
              <Pipette className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block">
                {t.hub.activeColor}
              </span>
              <span className="text-sm font-mono mono-tabular font-bold text-[color:var(--text-primary)] truncate block">
                {activeColorHex.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void copy(activeColorHex, 'hex', 'HEX')}
              className="apple-inner-box flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t.hub.copy}</span>
            </button>
            <button
              onClick={() => setActivePage('palettes')}
              className="flex h-8 items-center gap-1.5 px-3.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{t.hub.swatches}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Audio Status Card */}
        <div className="apple-card flex items-center justify-between p-4.5 sm:px-5 sm:py-4.5 min-h-[88px] gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-md shrink-0 transition-all ${
                eqEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
                  : 'apple-inner-box text-tertiary'
              }`}
            >
              <Sliders className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block">
                {t.hub.audioStudio}
              </span>
              <span className="text-xs font-semibold text-[color:var(--text-primary)] truncate block max-w-[160px] sm:max-w-[200px]">
                {eqEnabled
                  ? `${activePresetName || t.hub.eqActive} (${preamp > 0 ? `+${preamp.toFixed(1)}` : preamp.toFixed(1)} dB)`
                  : t.hub.eqBypass}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActivePage('audio-eq')}
              className="apple-inner-box flex h-8 items-center gap-1 px-3 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{t.hub.adjust}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleEqEnabled}
              className={`flex h-8 items-center gap-1.5 px-3.5 text-xs font-semibold rounded-xl transition shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
                eqEnabled
                  ? 'bg-[#30D158] hover:bg-[#28B84D] text-white'
                  : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{eqEnabled ? t.hub.active : t.hub.bypass}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
            {t.hub.allTools}
          </h3>
          <span className="text-xs text-tertiary">{t.hub.modulesCount}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {quickTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <motion.div
                key={tool.id}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={tool.action}
                className="apple-card group flex flex-col justify-between p-5 transition-all cursor-pointer hover:border-[color:var(--panel-border-strong)]"
              >
                <div className="space-y-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${tool.color}20`, color: tool.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[color:var(--text-primary)] group-hover:text-[#0A84FF] transition-colors">
                      {tool.title}
                    </h4>
                    <p className="text-xs text-secondary mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold text-[#0A84FF] pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t.hub.access}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
