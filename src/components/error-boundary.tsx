"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-center space-y-2">
            <p className="text-destructive font-medium">Something went wrong</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-primary underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
