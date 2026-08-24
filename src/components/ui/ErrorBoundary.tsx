import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("serenity-audio-storage-v2");
      localStorage.removeItem("serenity-audio-storage-v3");
      localStorage.removeItem("serenity-ui-storage");
    } catch {}
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center select-none">
          <div className="apple-card flex max-w-lg flex-col items-center gap-4 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[color:var(--text-primary)]">
                Un problème est survenu lors de l'affichage
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {this.state.error?.message || "Une erreur inattendue est survenue."}
              </p>
            </div>

            <div className="flex w-full items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="apple-inner-box flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:border-[color:var(--panel-border-strong)] transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Réessayer</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 rounded-xl bg-[#0A84FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0071E3] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Réinitialiser les données</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
