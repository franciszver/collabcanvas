import './App.css'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import SignInButton from './components/Auth/SignInButton'
import Canvas from './components/Canvas/Canvas'
import AppLayout from './components/Layout/AppLayout'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import DetailsDropdown from './components/Header/DetailsDropdown'
import ShapeSelector from './components/Header/ShapeSelector'
import ChatBox from './components/Chat/ChatBox'
import { APP_VERSION } from './version'
import { CanvasProvider } from './contexts/CanvasContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { cleanupService } from './services/cleanup'

function App() {
  const { user, isLoading } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Initialize cleanup service when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('🧹 Starting cleanup service for authenticated user')
      cleanupService.start()
    } else {
      console.log('🧹 Stopping cleanup service for unauthenticated user')
      cleanupService.stop()
    }

    // Cleanup on unmount
    return () => {
      cleanupService.stop()
    }
  }, [user])

  console.log('📱 App: Current state - user:', user, 'isLoading:', isLoading)

  if (isLoading) return null

  return (
    <div>
      {!user ? (
        <>
          <h1 style={{ marginBottom: 4 }}>Welcome to Chatty Canvas</h1>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>v{APP_VERSION}</div>
          <SignInButton />
        </>
      ) : (
        <PresenceProvider>
          <CanvasProvider>
            <AppLayout>
              <ErrorBoundary>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid #374151',
                  background: '#1f2937',
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: '50%',
                  zIndex: 100,
                  borderBottomLeftRadius: 8,
                }}
              >
                <div>
                  <h1 style={{ margin: 0 }}>Chatty Canvas</h1>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>v{APP_VERSION}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShapeSelector />
                  <DetailsDropdown />
                </div>
              </div>
              <Canvas />
              <ChatBox isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
              </ErrorBoundary>
            </AppLayout>
          </CanvasProvider>
        </PresenceProvider>
      )}
    </div>
  )
}

export default App
