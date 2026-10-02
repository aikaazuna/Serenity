import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAutoEqPreset } from './autoeq-service';
import type { AutoEqModelEntry } from './autoeq-service';

describe('autoeq-service', () => {
  const mockModel: AutoEqModelEntry = {
    id: 'test_model',
    name: 'Test Model',
    brand: 'Test Brand',
    path: 'test_path',
    source: 'test_source',
    form: 'over-ear',
    normName: 'testmodel',
    normBrand: 'testbrand',
    normSource: 'testsource',
  };

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should handle corrupted localStorage gracefully and remove the corrupted item even if download fails', async () => {
    // Setup a corrupted JSON in localStorage
    localStorage.setItem(`autoeq_cache_${mockModel.id}`, 'invalid-json');

    // Mock fetch to simulate download failure
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(getAutoEqPreset(mockModel)).rejects.toThrow('Network error');

    // The corrupted cache should have been removed
    expect(localStorage.getItem(`autoeq_cache_${mockModel.id}`)).toBeNull();
  });
});
