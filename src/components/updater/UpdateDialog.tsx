import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Download, RefreshCw, Sparkles } from "lucide-react";
import type { UpdateInfo, UpdateProgress } from "@shared/types";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/hooks/useI18n";
import type { UpdateDialogState } from "@/hooks/useAutoUpdater";

interface UpdateDialogProps {
  open: boolean;
  state: UpdateDialogState;
  updateInfo: UpdateInfo | null;
  progress: UpdateProgress | null;
  errorMessage: string | null;
  onInstall: () => void;
  onDismiss: () => void;
  onRestart: () => void;
  onRetry: () => void;
}

function truncateNotes(notes: string, maxLen = 280): string {
  const cleaned = notes.replace(/\r\n/g, "\n").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen).trim()}…`;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function UpdateDialog({
  open,
  state,
  updateInfo,
  progress,
  errorMessage,
  onInstall,
  onDismiss,
  onRestart,
  onRetry,
}: UpdateDialogProps) {
  const t = useI18n();

  const progressMessage = (() => {
    const msg = progress?.message;
    if (msg === "checking") return t.updater.checking;
    if (msg === "connecting") return t.updater.connecting;
    if (msg === "downloading") {
      const pct = progress?.percent ?? 0;
      return t.updater.downloading.replace("{percent}", String(pct));
    }
    if (msg === "ready") return t.updater.downloadComplete;
    return t.updater.preparing;
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[450] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={state === "downloading" ? undefined : onDismiss}
          />

          <motion.div
            className="glass-panel relative z-10 w-[440px] rounded-2xl border border-[color:var(--panel-border)] p-5 shadow-glass-lg"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div className="mb-4 flex items-start gap-3">
              <motion.div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--panel-border-strong)] bg-gradient-to-br from-indigo-500/20 to-pink-500/20"
                animate={state === "downloading" ? { rotate: [0, 8, -8, 0] } : {}}
                transition={{ duration: 0.6, repeat: state === "downloading" ? Infinity : 0, repeatDelay: 1.2 }}
              >
                {state === "error" ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : state === "ready" ? (
                  <Sparkles className="h-5 w-5 text-amber-300" />
                ) : (
                  <Download className="h-5 w-5 text-indigo-300" />
                )}
              </motion.div>

              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">
                  {state === "error"
                    ? t.updater.errorTitle
                    : state === "ready"
                      ? t.updater.readyTitle
                      : state === "downloading"
                        ? t.updater.downloadingTitle
                        : t.updater.availableTitle.replace("{version}", updateInfo?.version ?? "")}
                </h2>
                <p className="mt-1 text-xs text-secondary">
                  {state === "error"
                    ? errorMessage ?? t.updater.errorGeneric
                    : state === "ready"
                      ? updateInfo?.isPortable
                        ? t.updater.readyPortableDesc
                        : t.updater.readyDesc.replace("{version}", updateInfo?.version ?? "")
                      : state === "downloading"
                        ? progressMessage
                        : t.updater.availableDesc
                            .replace("{current}", updateInfo?.currentVersion ?? "")
                            .replace("{version}", updateInfo?.version ?? "")}
                </p>
              </div>
            </div>

            {state === "available" && updateInfo?.releaseNotes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-white/[0.03] px-3 py-2.5"
              >
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-tertiary">
                  {t.updater.releaseNotes}
                </p>
                <p className="whitespace-pre-line text-[12px] leading-relaxed text-secondary">
                  {truncateNotes(updateInfo.releaseNotes)}
                </p>
              </motion.div>
            )}

            {(state === "downloading" || state === "ready") && (
              <div className="mb-4 space-y-2">
                <ProgressBar percent={progress?.percent ?? (state === "ready" ? 100 : 0)} />
                {state === "downloading" && (
                  <motion.p
                    key={progressMessage}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-tertiary"
                  >
                    {progressMessage}
                  </motion.p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              {state === "available" && (
                <>
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    {t.updater.later}
                  </Button>
                  <Button variant="primary" size="sm" onClick={onInstall}>
                    <Download className="h-3.5 w-3.5" />
                    {t.updater.install.replace("{version}", updateInfo?.version ?? "")}
                  </Button>
                </>
              )}

              {state === "downloading" && (
                <Button variant="ghost" size="sm" disabled>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t.updater.inProgress}
                </Button>
              )}

              {state === "ready" && (
                <>
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    {t.updater.later}
                  </Button>
                  <Button variant="primary" size="sm" onClick={onRestart}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {updateInfo?.isPortable ? t.updater.openFile : t.updater.restart}
                  </Button>
                </>
              )}

              {state === "error" && (
                <>
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    {t.updater.later}
                  </Button>
                  <Button variant="primary" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t.updater.retry}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
