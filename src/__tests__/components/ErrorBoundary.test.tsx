import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/Layout/ErrorBoundary'

function Boom() {
  throw new Error('kaboom')
}

test('ErrorBoundary renders fallback on error', () => {
  // Mock console.error to prevent Jest from treating it as a test failure
  const originalConsoleError = console.error
  console.error = jest.fn()

  try {
    render(
      <ErrorBoundary>
        {/* @ts-expect-error testing error boundary */}
        <Boom />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/kaboom/i)).toBeInTheDocument()
    
    // Verify that console.error was called (error boundary should log errors)
    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error',
      expect.any(Error),
      expect.any(Object)
    )
  } finally {
    // Restore original console.error
    console.error = originalConsoleError
  }
})


