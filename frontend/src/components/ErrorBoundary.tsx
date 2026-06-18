import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("HelixAI interface error", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <AlertTriangle size={28} />
          <h1>HelixAI could not render this view</h1>
          <p>Reload the application. If the issue persists, inspect the browser console.</p>
          <button className="button button-primary" onClick={() => window.location.reload()}>
            Reload application
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
