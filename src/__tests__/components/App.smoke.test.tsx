<<<<<<< HEAD
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
=======
import { render, screen, waitFor } from '@testing-library/react'
import AuthProvider from '../../components/Auth/AuthProvider'
>>>>>>> Dev
jest.mock('../../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))
import App from '../../App'

test('renders welcome heading when logged out', async () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  )
  
  // Wait for loading to complete and welcome message to appear
  await waitFor(() => {
    expect(screen.getByText(/welcome to collabcanvas/i)).toBeInTheDocument()
  })
})


