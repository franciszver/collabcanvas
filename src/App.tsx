import './App.css'
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import SignInButton from './components/Auth/SignInButton'
import Canvas from './components/Canvas/Canvas'
import AppLayout from './components/Layout/AppLayout'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import TemplatesDropdown from './components/Header/TemplatesDropdown'
import ShapeSelector from './components/Header/ShapeSelector'
import StatsDropdown from './components/Header/StatsDropdown'
import UserMenu from './components/Header/UserMenu'
import ChatBox from './components/Chat/ChatBox'
import { APP_VERSION } from './version'
import { CanvasProvider } from './contexts/CanvasContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { cleanupService } from './services/cleanup'

function App() {
  const { user, isLoading } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const documentId = 'default-document' // Default document ID

  // Initialize cleanup service when user is authenticated
  useEffect(() => {
    if (user) {
      cleanupService.start()
    } else {
      cleanupService.stop()
    }

    // Cleanup on unmount
    return () => {
      cleanupService.stop()
    }
  }, [user])

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
          <CanvasProvider documentId={documentId}>
            <AppLayout>
              <ErrorBoundary>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  background: '#1f2937',
                  position: 'fixed',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  maxWidth: '1400px',
                  zIndex: 100,
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  border: '1px solid #374151',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Chatty Canvas</h1>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>v{APP_VERSION}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TemplatesDropdown documentId={documentId} />
                  <ShapeSelector />
                  <StatsDropdown />
                  <UserMenu />
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
