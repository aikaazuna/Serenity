import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWindowState } from "./useWindowState";
import * as utils from "@/lib/utils";

// Mock isElectron
vi.mock("@/lib/utils", () => ({
  isElectron: vi.fn(),
}));

describe("useWindowState", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // We must mock window properly since testing-library/react requires it
    const getStateMock = vi.fn();
    const onStateChangedMock = vi.fn(() => vi.fn());

    (global.window as any).serenity = {
      window: {
        getState: getStateMock,
        onStateChanged: onStateChangedMock,
      },
    };

    // Silence console.error for test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles promise rejection when getState fails", async () => {
    vi.mocked(utils.isElectron).mockReturnValue(true);

    // Mock a rejected promise for getState
    const error = new Error("IPC Communication failed");
    (window as any).serenity.window.getState.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useWindowState());

    // Initially uses default state
    expect(result.current).toEqual({ isMaximized: false, isMinimized: false });

    // Wait for the promise to settle
    await waitFor(() => {
      expect((window as any).serenity.window.getState).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(error);
    });

    // Ensures state stays default on failure
    expect(result.current).toEqual({ isMaximized: false, isMinimized: false });
  });

  it("sets state successfully when getState resolves", async () => {
    vi.mocked(utils.isElectron).mockReturnValue(true);

    const mockState = { isMaximized: true, isMinimized: false };
    (window as any).serenity.window.getState.mockResolvedValueOnce(mockState);

    const { result } = renderHook(() => useWindowState());

    await waitFor(() => {
      expect((window as any).serenity.window.getState).toHaveBeenCalled();
      expect(result.current).toEqual(mockState);
    });
  });
});
