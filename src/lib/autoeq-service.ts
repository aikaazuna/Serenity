import compactData from './autoeq-compact.json';
import { BUILTIN_PRESETS } from './presets-data';
import { EQEngine } from './eq-engine';
import type { AudioPreset } from '@/types/audio';

export interface AutoEqModelEntry {
  id: string;
  name: string;
  brand: string;
  path: string;
  source: string;
  form: 'over-ear' | 'in-ear' | 'earbud';
  normName: string;
  normBrand: string;
  normSource: string;
}

export function normalizeSearchText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_(),/.+]/g, '');
}

// Convert compact tuple array [id, name, brand, path, source, form] to pre-indexed typed objects
export const ALL_AUTOEQ_MODELS: AutoEqModelEntry[] = (compactData as [string, string, string, string, string, 'over-ear' | 'in-ear' | 'earbud'][]).map(
  ([id, name, brand, path, source, form]) => ({
    id,
    name,
    brand,
    path,
    source,
    form,
    normName: normalizeSearchText(name),
    normBrand: normalizeSearchText(brand),
    normSource: normalizeSearchText(source),
  })
);

/**
 * Ultra-fast (<0.5ms) pre-indexed search over 6,290 AutoEq models with max limit
 */
export function searchAutoEqModels(
  rawQuery: string,
  selectedBrand: string = 'Tous',
  selectedForm: 'all' | 'over-ear' | 'in-ear' | 'earbud' | 'genre' = 'all',
  maxLimit: number = 200
): AutoEqModelEntry[] {
  if (selectedBrand === 'Genres & Gaming' || selectedForm === 'genre') {
    return [];
  }

  const rawQ = (rawQuery || '').trim();
  const qNorm = normalizeSearchText(rawQ);
  const qWords = rawQ.toLowerCase().split(/\s+/).filter(Boolean).map(normalizeSearchText);
  const isSearchingAuthor =
    qNorm.includes('oratory') ||
    qNorm.includes('crinacle') ||
    qNorm.includes('rtings') ||
    qNorm.includes('innerfidelity') ||
    qNorm.includes('superreview') ||
    qNorm.includes('harman');

  const results: AutoEqModelEntry[] = [];
  const len = ALL_AUTOEQ_MODELS.length;

  for (let i = 0; i < len; i++) {
    const item = ALL_AUTOEQ_MODELS[i];
    if (!item) continue;

    // 1. Form factor filter
    if (selectedForm !== 'all' && item.form !== selectedForm) {
      continue;
    }

    // 2. Brand filter: only applies if user picked a brand AND no active search query
    if (selectedBrand !== 'Tous' && !rawQ && item.brand !== selectedBrand) {
      continue;
    }

    // 3. Query search
    if (qNorm) {
      // Direct substring match in normalized model name
      if (item.normName.includes(qNorm)) {
        if (selectedBrand === 'Tous' || item.brand === selectedBrand) {
          results.push(item);
          if (results.length >= maxLimit) break;
          continue;
        }
      }

      // Multi-word match: ALL query words must match name or brand (or source if author)
      let matchesAll = true;
      for (let j = 0; j < qWords.length; j++) {
        const w = qWords[j];
        if (!w) continue;
        const inName = item.normName.includes(w);
        const inBrand = item.normBrand.includes(w);
        const inSource = isSearchingAuthor && item.normSource.includes(w);
        if (!inName && !inBrand && !inSource) {
          matchesAll = false;
          break;
        }
      }

      if (matchesAll) {
        if (selectedBrand === 'Tous' || item.brand === selectedBrand) {
          results.push(item);
          if (results.length >= maxLimit) break;
        }
      }
    } else {
      results.push(item);
      if (results.length >= maxLimit) break;
    }
  }

  return results;
}

// Map of pre-bundled presets for instant offline use
const PRELOADED_MAP = new Map<string, AudioPreset>();
for (const p of BUILTIN_PRESETS) {
  PRELOADED_MAP.set(p.name.toLowerCase(), p);
}

// In-memory cache for fetched AutoEQ profiles during this session
const RUNTIME_CACHE = new Map<string, AudioPreset>();

/**
 * Fetch and parse a Parametric EQ profile from AutoEq GitHub repository.
 */
export async function getAutoEqPreset(model: AutoEqModelEntry): Promise<AudioPreset> {
  const normName = model.name.toLowerCase();

  // 1. Check pre-bundled built-in presets
  if (PRELOADED_MAP.has(normName)) {
    return PRELOADED_MAP.get(normName)!;
  }

  // 2. Check runtime memory cache
  if (RUNTIME_CACHE.has(model.id)) {
    return RUNTIME_CACHE.get(model.id)!;
  }

  // 3. Check localStorage cache
  try {
    const cached = localStorage.getItem(`autoeq_cache_${model.id}`);
    if (cached) {
      const parsed = JSON.parse(cached) as AudioPreset;
      RUNTIME_CACHE.set(model.id, parsed);
      return parsed;
    }
  } catch {}

  // 4. Download on-demand from official AutoEq GitHub
  const rawPath = decodeURIComponent(model.path);
  const pathSegments = rawPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const folderName = rawPath.split("/").pop() || model.name;
  const fileName = `${encodeURIComponent(folderName)}%20ParametricEQ.txt`;
  
  const rawUrlMaster = `https://raw.githubusercontent.com/jaakkopasanen/AutoEq/master/results/${pathSegments}/${fileName}`;
  const rawUrlMain = `https://raw.githubusercontent.com/jaakkopasanen/AutoEq/main/results/${pathSegments}/${fileName}`;

  try {
    let response = await fetch(rawUrlMaster);
    if (!response.ok && response.status === 404) {
      response = await fetch(rawUrlMain);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to download calibration`);
    }
    const textContent = await response.text();
    const parsedState = EQEngine.parseConfig(textContent);

    const preset: AudioPreset = {
      id: model.id,
      name: model.name,
      brand: model.brand,
      category: 'autoeq',
      author: `AutoEq (${model.source})`,
      description: `Calibration acoustique Harman Target mesurée par ${model.source}.`,
      mode: 'parametric',
      preamp: parsedState.preamp ?? 0,
      parametricFilters: parsedState.filters || [],
    };

    RUNTIME_CACHE.set(model.id, preset);
    try {
      localStorage.setItem(`autoeq_cache_${model.id}`, JSON.stringify(preset));
    } catch {}

    return preset;
  } catch (error) {
    console.error('Failed to download AutoEQ profile:', error);
    throw error;
  }
}
