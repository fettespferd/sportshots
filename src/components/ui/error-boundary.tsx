"use client";

import React, { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} resetError={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-900">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg
            className="h-10 w-10 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Oops! Etwas ist schiefgelaufen
        </h1>
        
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>

        {error && process.env.NODE_ENV === "development" && (
          <details className="mb-6 rounded-lg bg-red-50 p-4 text-left text-sm dark:bg-red-900/10">
            <summary className="cursor-pointer font-medium text-red-900 dark:text-red-400">
              Fehlerdetails (nur in Entwicklung sichtbar)
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-red-800 dark:text-red-300">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              resetError();
              window.location.reload();
            }}
            className="min-h-[44px] rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Seite neu laden
          </button>
          
          <Link
            href="/"
            className="min-h-[44px] inline-flex items-center justify-center rounded-lg border-2 border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-900 transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-50 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
