import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  title?: string
}

interface State {
  hasError: boolean
  message: string
}

/**
 * React error boundary that catches render-time errors thrown by its children
 * and displays a styled error card in their place instead of crashing the whole page.
 * The optional `title` prop customises the heading shown in the error card.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  /** Derives error state from the thrown value so the next render shows the fallback UI. */
  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          <p className="font-medium">{this.props.title ?? 'Widget failed to load'}</p>
          <p className="mt-0.5 text-xs opacity-75">{this.state.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
