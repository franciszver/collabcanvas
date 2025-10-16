import { render } from '@testing-library/react'
import { AuthProvider } from '../../contexts/AuthContext'
import SignInButton from '../../components/Auth/SignInButton'

describe('SignInButton', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <SignInButton />
      </AuthProvider>
    )
  })
})


