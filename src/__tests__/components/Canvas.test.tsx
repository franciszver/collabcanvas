import { render } from '@testing-library/react'
import AuthProvider from '../../components/Auth/AuthProvider'
jest.mock('../../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))
import Canvas from '../../components/Canvas/Canvas'

describe('Canvas', () => {
  it('renders placeholder without crashing', () => {
    render(
      <AuthProvider>
        <Canvas />
      </AuthProvider>
    )
  })
})


