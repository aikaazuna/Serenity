import { useEffect, useState } from "react";
import { isElectron } from "@/lib/utils";

interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
}

const DEFAULT_STATE: WindowState = { isMaximized: false, isMinimized: false };

export function useWindowState(): WindowState {
  const [state, setState] = useState<WindowState>(DEFAULT_STATE);

  useEffect(() => {
    if (!isElectron()) return;

    void window.serenity.window.getState().then(setState);
    return window.serenity.window.onStateChanged(setState);
  }, []);

  return state;
}
