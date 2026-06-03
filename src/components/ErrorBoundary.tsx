import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center app-bg p-5 text-center">
          <div className="max-w-md glass p-6 border border-red-500/20">
            <span className="text-4xl">⚠️</span>
            <h1 className="text-xl font-bold text-red-500 mt-3">Something went wrong</h1>
            <p className="text-xs text-secondary mt-2">
              The application crashed due to a runtime error:
            </p>
            <pre className="mt-4 p-3 bg-black/40 rounded-xl text-left text-xs font-mono overflow-auto max-h-40 text-red-400 border border-white/5">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient mt-5 text-sm py-2 px-4"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
