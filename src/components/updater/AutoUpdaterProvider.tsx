import { useAutoUpdater } from "@/hooks/useAutoUpdater";
import { UpdateDialog } from "@/components/updater/UpdateDialog";

export function AutoUpdaterProvider() {
  const updater = useAutoUpdater();

  return (
    <UpdateDialog
      open={updater.open}
      state={updater.state}
      updateInfo={updater.updateInfo}
      progress={updater.progress}
      errorMessage={updater.errorMessage}
      onInstall={updater.handleInstall}
      onDismiss={updater.handleDismiss}
      onRestart={updater.handleRestart}
      onRetry={updater.handleRetry}
    />
  );
}
