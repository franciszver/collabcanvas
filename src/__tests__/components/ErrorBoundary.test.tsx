import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/Layout/ErrorBoundary'

function Boom() {
  throw new Error('kaboom')
}

test('ErrorBoundary renders fallback on error', () => {
  render(
    <ErrorBoundary>
      {/* @ts-expect-error testing error boundary */}
      <Boom />
    </ErrorBoundary>
  )
  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  expect(screen.getByText(/kaboom/i)).toBeInTheDocument()
})


