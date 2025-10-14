import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: '#FCA5A5', background: '#111827' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Something went wrong.</div>
          <div style={{ fontSize: 12, color: '#FECACA' }}>{this.state.message ?? 'Unknown error'}</div>
        </div>
      )
    }
    return this.props.children
  }
}


