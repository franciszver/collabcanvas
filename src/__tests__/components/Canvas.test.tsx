import { render } from '@testing-library/react'
import AuthProvider from '../../components/Auth/AuthProvider'
import { CanvasProvider } from '../../contexts/CanvasContext'
import { PresenceProvider } from '../../contexts/PresenceContext'
jest.mock('../../services/firebase', () => ({ getFirebaseApp: jest.fn(() => ({})) }))
import Canvas from '../../components/Canvas/Canvas'

describe('Canvas', () => {
  it('renders placeholder without crashing', () => {
    render(
      <AuthProvider>
        <PresenceProvider>
          <CanvasProvider>
            <Canvas />
          </CanvasProvider>
        </PresenceProvider>
      </AuthProvider>
    )
  })
})


