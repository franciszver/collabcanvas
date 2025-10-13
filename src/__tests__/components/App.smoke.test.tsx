import { render, screen } from '@testing-library/react'
import AuthProvider from '../../components/Auth/AuthProvider'
jest.mock('../../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))
import App from '../../App'

test('renders welcome heading when logged out', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  expect(screen.getByText(/welcome to collabcanvas/i)).toBeInTheDocument()
})


