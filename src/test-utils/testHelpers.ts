// Test utilities and helpers for better test coverage
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { CanvasProvider } from '../contexts/CanvasContext'
import { PresenceProvider } from '../contexts/PresenceContext'

// Custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <PresenceProvider>
        <CanvasProvider>
          {children}
        </CanvasProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
  ...overrides,
})

export const createMockShape = (overrides = {}) => ({
  id: 'test-shape-id',
  type: 'rect' as const,
  x: 100,
  y: 100,
  width: 50,
  height: 50,
  rotation: 0,
  z: 1,
  fill: '#ff0000',
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1,
  createdBy: 'test-user-id',
  createdAt: { '.sv': 'timestamp' },
  updatedBy: 'test-user-id',
  updatedAt: { '.sv': 'timestamp' },
  documentId: 'test-doc-id',
  ...overrides,
})

export const createMockDocument = (overrides = {}) => ({
  id: 'test-doc-id',
  title: 'Test Document',
  createdBy: 'test-user-id',
  createdAt: { '.sv': 'timestamp' },
  updatedBy: 'test-user-id',
  updatedAt: { '.sv': 'timestamp' },
  ...overrides,
})

export const createMockCursorPosition = (overrides = {}) => ({
  x: 100,
  y: 100,
  ...overrides,
})

export const createMockUserPresence = (overrides = {}) => ({
  userId: 'test-user-id',
  displayName: 'Test User',
  cursor: createMockCursorPosition(),
  updatedAt: Date.now(),
  ...overrides,
})

// Mock Firebase functions
export const mockFirebaseFunctions = {
  mockOnSnapshot: (data: any, exists = true) => {
    const mockSnapshot = {
      exists: () => exists,
      data: () => data,
      id: 'mock-doc-id',
      ref: {},
      metadata: { fromCache: false, hasPendingWrites: false },
    }
    return jest.fn((query, callback) => {
      setTimeout(() => callback(mockSnapshot), 0)
      return jest.fn() // unsubscribe function
    })
  },
  
  mockOnValue: (data: any) => {
    const mockSnapshot = {
      val: () => data,
    }
    return jest.fn((ref, callback) => {
      setTimeout(() => callback(mockSnapshot), 0)
      return jest.fn() // unsubscribe function
    })
  },
}

// Test event helpers
export const createMockMouseEvent = (overrides = {}) => ({
  clientX: 100,
  clientY: 100,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  ...overrides,
})

export const createMockWheelEvent = (overrides = {}) => ({
  deltaY: 1,
  preventDefault: jest.fn(),
  ...overrides,
})

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
