import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStoreValue } from './persistence';
import * as utils from './utils';

vi.mock('./utils', () => ({
  isElectron: vi.fn(),
}));

describe('persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('handles corrupted localStorage JSON gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem('serenity:settings', '{ corrupted json');

    // We mock isElectron so it uses the localStorage fallback path
    vi.mocked(utils.isElectron).mockReturnValue(false);

    // Ensure window.serenity is undefined so isElectron() returns false naturally
    if ('serenity' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).serenity;
    }

    // We mock the getItem logic so we can spy on it properly and bypass JSDOM weirdness
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{ corrupted json');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    // Make sure we wait for the promise to resolve in case it matters for vitest mock lifecycle
    const result = await getStoreValue('settings');

    expect(result).toBeDefined(); // It should be the DEFAULT_SETTINGS
    expect(removeItemSpy).toHaveBeenCalledWith('serenity:settings');
    expect(errorSpy).toHaveBeenCalled();
  });
});
