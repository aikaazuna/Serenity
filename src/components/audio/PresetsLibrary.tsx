import React, { useState, useMemo, useCallback } from 'react';
import { useAudioStore } from '@/state/audioStore';
import { useAppStore } from '@/state/appStore';
import { useI18n } from '@/hooks/useI18n';
import { BUILTIN_PRESETS, AUTOEQ_ATTRIBUTION } from '@/lib/presets-data';
import {
  getAutoEqPreset,
  searchAutoEqModels,
  ALL_AUTOEQ_MODELS,
  normalizeSearchText,
  type AutoEqModelEntry,
} from '@/lib/autoeq-service';
import type { AudioPreset } from '@/types/audio';
import {
  Headphones,
  Search,
  Check,
  Gamepad2,
  Film,
  Music,
  ExternalLink,
  ShieldCheck,
  Sliders,
  Loader2,
  Sparkles,
  Layers,
  Volume2,
  X,
  RotateCcw,
} from 'lucide-react';

const POPULAR_BRANDS = [
  'Tous',
  'Apple',
  'Sennheiser',
  'Sony',
  'Beyerdynamic',
  'Bose',
  'Audio-Technica',
  'AKG',
  'Hifiman',
  'Audeze',
  'Focal',
  'Moondrop',
  'KZ',
  'Final',
  'Dunu',
  'JBL',
  'Shure',
  'Grado',
  'STAX',
  'FiiO',
  'TRUTHEAR',
  'SteelSeries',
  'HyperX',
  'Logitech',
  'Samsung',
  'Philips',
  'Meze',
  'Razer',
  'Genres & Gaming',
] as const;

export const PresetsLibrary: React.FC = () => {
  const activePresetName = useAudioStore((s) => s.activePresetName);
  const applyPreset = useAudioStore((s) => s.applyPreset);
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();

  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Tous');
  const [selectedForm, setSelectedForm] = useState<'all' | 'over-ear' | 'in-ear' | 'earbud' | 'genre'>('all');
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(48);

  // Filtered AutoEq Models
  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query]);

  // 1. Built-in Genres matching query & brand
  const matchingGenres = useMemo(() => {
    if (selectedForm === 'over-ear' || selectedForm === 'in-ear') return [];

    return BUILTIN_PRESETS.filter((p) => {
      if (selectedBrand !== 'Tous' && selectedBrand !== 'Genres & Gaming') return false;
      if (!normalizedQuery) return true;
      const nName = normalizeSearchText(p.name);
      const nDesc = normalizeSearchText(p.description || '');
      return nName.includes(normalizedQuery) || nDesc.includes(normalizedQuery);
    });
  }, [normalizedQuery, selectedBrand, selectedForm]);

  // 2. AutoEq Models matching filters
  const matchingAutoEq = useMemo(() => {
    if (selectedForm === 'genre' || selectedBrand === 'Genres & Gaming') return [];

    return searchAutoEqModels(query, selectedBrand, selectedForm, 1200);
  }, [query, selectedBrand, selectedForm]);

  const totalCount = matchingGenres.length + matchingAutoEq.length;

  const handleSelectModel = useCallback(
    async (model: AutoEqModelEntry) => {
      setLoadingModelId(model.id);
      try {
        const preset = await getAutoEqPreset(model);
        if (preset) {
          applyPreset(preset);
          notify(`Calibration « ${model.name} » appliquée`, 'success');
        } else {
          notify(`Impossible de charger la calibration pour ${model.name}`, 'warning');
        }
      } catch (err) {
        notify(`Erreur lors du chargement de ${model.name}`, 'warning');
      } finally {
        setLoadingModelId(null);
      }
    },
    [applyPreset, notify]
  );

  const handleSelectBuiltin = useCallback(
    (preset: AudioPreset) => {
      applyPreset(preset);
      notify(`Profil « ${preset.name} » appliqué`, 'success');
    },
    [applyPreset, notify]
  );

  const resetAllFilters = useCallback(() => {
    setQuery('');
    setSelectedBrand('Tous');
    setSelectedForm('all');
    setDisplayLimit(48);
  }, []);

  const getGenreIcon = (category: string) => {
    if (category === 'gaming') return <Gamepad2 className="w-4 h-4 text-emerald-500" />;
    if (category === 'cinema') return <Film className="w-4 h-4 text-purple-500" />;
    if (category === 'genre') return <Music className="w-4 h-4 text-amber-500" />;
    return <Sliders className="w-4 h-4 text-[#0A84FF]" />;
  };

  return (
    <div className="apple-card p-5 select-none space-y-4">
      {/* Top Header with Live Search Input */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--card-border)] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Headphones className="w-5 h-5 text-[#0A84FF]" />
          <div>
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.presets.title}
            </h3>
            <p className="text-[11px] text-tertiary">
              {ALL_AUTOEQ_MODELS.length.toLocaleString()} {t.presets.subtitle}
            </p>
          </div>
        </div>

        {/* Search Bar with Instant Key Capture */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t.presets.searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDisplayLimit(48);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('');
            }}
            className="apple-inner-box w-full pl-10 pr-9 py-2 text-xs text-[color:var(--text-primary)] focus-ring rounded-xl shadow-inner font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-[color:var(--text-primary)] p-0.5 cursor-pointer transition-colors"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Attribution Banner */}
      <div className="apple-inner-box flex flex-wrap items-center justify-between p-3 rounded-xl gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4.5 h-4.5 text-[#0A84FF] shrink-0" />
          <p className="text-[11.5px] text-secondary leading-snug">
            {t.presetsAttribution.description} <strong className="text-[color:var(--text-primary)]">{t.presetsAttribution.bold}</strong> {t.presetsAttribution.measured} 
          </p>
        </div>
        <a
          href={AUTOEQ_ATTRIBUTION.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0A84FF] hover:underline shrink-0"
        >
          <span>{t.presetsAttribution.github}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Form Factor Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setSelectedForm('all'); setDisplayLimit(48); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            selectedForm === 'all'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t.presets.allFormats}</span>
        </button>
        <button
          onClick={() => { setSelectedForm('over-ear'); setDisplayLimit(48); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            selectedForm === 'over-ear'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>{t.presets.overEar}</span>
        </button>
        <button
          onClick={() => { setSelectedForm('in-ear'); setDisplayLimit(48); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            selectedForm === 'in-ear'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{t.presets.inEar}</span>
        </button>
        <button
          onClick={() => { setSelectedForm('genre'); setDisplayLimit(48); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            selectedForm === 'genre'
              ? 'bg-[#0A84FF] text-white shadow-sm'
              : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.presets.genres}</span>
        </button>
      </div>

      {/* Brand Horizontal Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {POPULAR_BRANDS.map((brand) => {
          const isSelected = selectedBrand === brand;
          return (
            <button
              key={brand}
              onClick={() => {
                setSelectedBrand(brand);
                setDisplayLimit(48);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer ${
                isSelected
                  ? 'bg-[#0A84FF] text-white shadow-sm'
                  : 'apple-inner-box text-secondary hover:text-[color:var(--text-primary)]'
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-tertiary px-1">
        <span>
          <strong className="text-[color:var(--text-primary)] font-mono">{totalCount.toLocaleString('fr-FR')}</strong> {totalCount > 1 ? t.presets.resultsFoundPlural : t.presets.resultsFound}
          {query ? ` ${t.presets.forQuery} « ${query} »` : selectedBrand !== 'Tous' ? ` ${t.presets.forBrand} ${selectedBrand}` : ''}
        </span>
        {totalCount > displayLimit && (
          <span>1 - {displayLimit} / {totalCount.toLocaleString()}</span>
        )}
      </div>

      {/* Dynamic Results Grid */}
      {totalCount === 0 ? (
        <div className="apple-inner-box text-center py-12 px-4 rounded-2xl space-y-3">
          <Headphones className="w-8 h-8 text-tertiary mx-auto opacity-50" />
          <p className="text-xs text-tertiary font-medium">
            {t.presets.noResults} « <span className="text-[color:var(--text-primary)] font-semibold">{query}</span> ».
          </p>
          <button
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0A84FF] hover:text-white hover:bg-[#0A84FF] apple-inner-box transition rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.presets.resetFilters}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Built-in Genre & Gaming Presets */}
          {matchingGenres.map((preset) => {
            const isSelected = activePresetName === preset.name;

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectBuiltin(preset)}
                className={`apple-inner-box group flex flex-col justify-between p-3.5 transition cursor-pointer rounded-xl ${
                  isSelected
                    ? 'border-[#0A84FF] ring-1 ring-[#0A84FF] bg-[#0A84FF]/5'
                    : 'hover:border-[color:var(--panel-border-strong)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getGenreIcon(preset.category)}
                      <h4 className="text-xs font-bold text-[color:var(--text-primary)] group-hover:text-[#0A84FF] transition truncate">
                        {preset.name}
                      </h4>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-500 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.presets.active}</span>
                      </span>
                    )}
                  </div>

                  {preset.description && (
                    <p className="text-[11px] text-secondary leading-snug line-clamp-2">
                      {preset.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 text-[10.5px] font-mono text-tertiary border-t border-[color:var(--card-border-inner)] mt-2">
                  <span className="text-[10px] uppercase font-bold text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {preset.category}
                  </span>
                  <span>{preset.parametricFilters?.length ?? 0} {t.presets.filtersCount}</span>
                </div>
              </div>
            );
          })}

          {/* 2. AutoEq Models Strictly Filtered */}
          {matchingAutoEq.slice(0, displayLimit).map((model) => {
            const isSelected = activePresetName === model.name;
            const isLoading = loadingModelId === model.id;

            return (
              <div
                key={model.id}
                onClick={() => !isLoading && void handleSelectModel(model)}
                className={`apple-inner-box group flex flex-col justify-between p-3.5 transition cursor-pointer rounded-xl ${
                  isSelected
                    ? 'border-[#0A84FF] ring-1 ring-[#0A84FF] bg-[#0A84FF]/5'
                    : 'hover:border-[color:var(--panel-border-strong)]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Headphones className="w-4 h-4 text-[#0A84FF] shrink-0" />
                      <h4
                        className="text-xs font-bold text-[color:var(--text-primary)] group-hover:text-[#0A84FF] transition truncate"
                        title={model.name}
                      >
                        {model.name}
                      </h4>
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#0A84FF] animate-spin shrink-0" />
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-500 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.presets.active}</span>
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-secondary leading-snug line-clamp-2">
                    {t.presets.measuredBy} {model.source}.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 text-[10.5px] font-mono text-tertiary border-t border-[color:var(--card-border-inner)] mt-2">
                  <span className="text-[10px] font-semibold text-secondary bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                    {model.brand}
                  </span>
                  <span className="text-[10px] text-tertiary">
                    {model.form === 'in-ear' ? 'In-Ear' : model.form === 'earbud' ? 'Earbud' : 'Over-Ear'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination / Load More */}
      {matchingAutoEq.length > displayLimit && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setDisplayLimit((prev) => prev + 48)}
            className="apple-inner-box flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#0A84FF] hover:text-white hover:bg-[#0A84FF] transition rounded-xl shadow-sm cursor-pointer"
          >
            <span>{t.presets.loadMore} ({matchingAutoEq.length - displayLimit} restants)</span>
          </button>
        </div>
      )}
    </div>
  );
};
