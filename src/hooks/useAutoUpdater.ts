import { useCallback, useEffect, useState } from "react";
import type { UpdateInfo, UpdateProgress } from "@shared/types";
import { isElectron } from "@/lib/utils";

export type UpdateDialogState = "closed" | "available" | "downloading" | "ready" | "error";

export function useAutoUpdater() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<UpdateDialogState>("closed");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isElectron()) return;

    const offAvailable = window.colorflow.updater.onAvailable((info) => {
      setUpdateInfo(info);
      setState("available");
      setOpen(true);
      setErrorMessage(null);
    });

    const offProgress = window.colorflow.updater.onProgress((p) => {
      setProgress(p);
      // N'ouvrir le dialog que pendant un téléchargement actif (après clic « Installer »)
      if (p.phase === "connecting" || p.phase === "downloading") {
        setState("downloading");
        setOpen(true);
      }
      if (p.phase === "ready") {
        setState("ready");
        setOpen(true);
      }
    });

    const offReady = window.colorflow.updater.onReady(() => {
      setState("ready");
      setOpen(true);
    });

    const offError = window.colorflow.updater.onError(({ message }) => {
      setErrorMessage(message);
      setState("error");
      setOpen(true);
    });

    return () => {
      offAvailable();
      offProgress();
      offReady();
      offError();
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!isElectron()) return;
    setState("downloading");
    setProgress({ phase: "connecting", percent: 0, message: "connecting" });
    await window.colorflow.updater.download();
  }, []);

  const handleDismiss = useCallback(() => {
    if (updateInfo) {
      window.colorflow.updater.dismiss(updateInfo.version);
    }
    setOpen(false);
    setState("closed");
  }, [updateInfo]);

  const handleRestart = useCallback(async () => {
    if (!isElectron()) return;
    await window.colorflow.updater.install();
  }, []);

  const handleRetry = useCallback(async () => {
    setErrorMessage(null);
    setState("downloading");
    await window.colorflow.updater.download();
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!isElectron()) return { status: "error" as const, message: "Not in Electron" };
    return window.colorflow.updater.check();
  }, []);

  return {
    open,
    state,
    updateInfo,
    progress,
    errorMessage,
    handleInstall,
    handleDismiss,
    handleRestart,
    handleRetry,
    checkForUpdates,
    setOpen,
    setState,
    setUpdateInfo,
    setErrorMessage,
  };
}
