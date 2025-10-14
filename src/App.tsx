import './App.css'
import { useAuth } from './contexts/AuthContext'
import SignInButton from './components/Auth/SignInButton'
import Canvas from './components/Canvas/Canvas'
import AppLayout from './components/Layout/AppLayout'
import OnlineUsersDropdown from './components/Presence/OnlineUsersDropdown'
import ClearAllButton from './components/Canvas/ClearAllButton'
import { APP_VERSION } from './version'
import { CanvasProvider } from './contexts/CanvasContext'
import { PresenceProvider } from './contexts/PresenceContext'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  return (
    <div>
      {!user ? (
        <>
          <h1 style={{ marginBottom: 4 }}>Welcome to CollabCanvas</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>v{APP_VERSION}</div>
          <SignInButton />
        </>
      ) : (
        <PresenceProvider>
          <CanvasProvider>
            <AppLayout>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #1f2937',
                  background: '#0f172a',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <div>
                  <h1 style={{ margin: 0 }}>Canvas</h1>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>v{APP_VERSION}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <OnlineUsersDropdown />
                  <ClearAllButton />
                  <SignInButton />
                </div>
              </div>
              <Canvas />
            </AppLayout>
          </CanvasProvider>
        </PresenceProvider>
      )}
    </div>
  )
}

export default App
