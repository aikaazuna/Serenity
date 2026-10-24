import { describe, it, expect } from 'vitest';
import { EQEngine } from './eq-engine';
import type { AudioState } from '@/types/audio';

describe('EQEngine - Peak Gain & Anti-Clipping', () => {
  it('calculates 0 dB peak on flat response with 0 dB preamp', () => {
    const peak = EQEngine.calculatePeakGain([], 0, 0, 0, {}, 'parametric');
    expect(peak).toBeCloseTo(0, 1);
  });

  it('detects peak gain when bass filter is boosted', () => {
    // 29 Hz PK Gain +19.5 dB
    const peak = EQEngine.calculatePeakGain([
      { id: 'f-1', enabled: true, type: 'PK', freq: 29, gain: 19.5, q: 0.51 }
    ], 0, 0, 0, {}, 'parametric');
    
    expect(peak).toBeGreaterThanOrEqual(19.0);
  });

  it('automatically adjusts preamp when loudnessGuard is active to prevent clipping', () => {
    const state: AudioState = {
      mode: 'parametric',
      graphicBands: 10,
      preamp: 0,
      graphicFilters: {},
      parametricFilters: [
        { id: 'f-1', enabled: true, type: 'PK', freq: 29, gain: 19.5, q: 0.51 },
        { id: 'f-2', enabled: true, type: 'LSC', freq: 105, gain: 6.4, q: 0.70 },
      ],
      devices: ['all'],
      channel: 'all',
      eqEnabled: true,
      bassBoost: 0,
      trebleAir: 0,
      stereoBalance: 0,
      crossfeed: false,
      loudnessGuard: true,
      activePresetName: null,
      customPresets: [],
    };

    const config = EQEngine.generateConfig(state);
    const parsed = EQEngine.parseConfig(config);

    // Peak was ~24-25 dB, so effective preamp should be around -24 to -26 dB
    expect(parsed.preamp).toBeLessThanOrEqual(-20);
    // Combined response with the adjusted preamp should never exceed 0 dBFS
    const combinedPeak = EQEngine.calculatePeakGain(
      state.parametricFilters,
      parsed.preamp,
      state.bassBoost,
      state.trebleAir,
      state.graphicFilters,
      state.mode
    );
    expect(combinedPeak).toBeLessThanOrEqual(0.05);
  });

  it('does not force preamp adjustment when loudnessGuard is disabled', () => {
    const state: AudioState = {
      mode: 'parametric',
      graphicBands: 10,
      preamp: 0,
      graphicFilters: {},
      parametricFilters: [
        { id: 'f-1', enabled: true, type: 'PK', freq: 29, gain: 19.5, q: 0.51 },
      ],
      devices: ['all'],
      channel: 'all',
      eqEnabled: true,
      bassBoost: 0,
      trebleAir: 0,
      stereoBalance: 0,
      crossfeed: false,
      loudnessGuard: false,
      activePresetName: null,
      customPresets: [],
    };

    const config = EQEngine.generateConfig(state);
    const parsed = EQEngine.parseConfig(config);
    expect(parsed.preamp).toBe(0);
  });
});
