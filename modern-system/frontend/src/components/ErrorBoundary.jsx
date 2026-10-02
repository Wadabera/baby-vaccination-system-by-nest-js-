import { Component } from "react";
import { RefreshCw, Home, TriangleAlert } from "lucide-react";

/**
 * Catches render-time errors anywhere below it.
 *
 * Without this a single bad render unmounts the whole tree and the user
 * is left staring at a blank white page with no way back. The fallback
 * keeps the navigation available so the app is still recoverable.
 *
 * Errors are logged rather than reported: there is no error-reporting
 * service wired up, and the console is the only sink available.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) return children;

    return (
      <div className="container mx-auto grid min-h-[70vh] place-items-center px-6 py-12">
        <div className="card max-w-lg text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-600">
            <TriangleAlert size={30} />
          </span>

          <h1 className="mb-2 text-2xl font-extrabold text-slate-900">
            Something went wrong on this screen
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-muted">
            The page failed to render. Reloading usually clears it. If it keeps
            happening, the details are in the browser console.
          </p>

          {/* Shown only in development: useful detail without leaking a
              stack trace to end users in production. */}
          {import.meta.env.DEV && (
            <pre className="mb-6 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-left font-mono text-xs text-slate-600">
              {String(error?.message ?? error)}
            </pre>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              <RefreshCw size={17} /> Reload
            </button>
            <a href="/" className="btn btn-soft">
              <Home size={17} /> Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
