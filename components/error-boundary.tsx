"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
              <WarningCircle size={28} weight="fill" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Something went wrong</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-xs">
              Component failed to load. Please try refreshing the page or check your data format.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 rounded-xl bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-sm border border-rose-100 hover:bg-rose-100 transition"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
