import './App.css'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from './contexts/AuthContext'
import SignInButton from './components/Auth/SignInButton'
import Canvas from './components/Canvas/Canvas'
import AppLayout from './components/Layout/AppLayout'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import TemplatesDropdown from './components/Header/TemplatesDropdown'
import ShapeSelector from './components/Header/ShapeSelector'
import StatsDropdown from './components/Header/StatsDropdown'
import LocateDropdown, { type LocateDropdownRef } from './components/Header/LocateDropdown'
import UserMenu from './components/Header/UserMenu'
import ChatBox from './components/Chat/ChatBox'
import { APP_VERSION } from './version'
import { CanvasProvider } from './contexts/CanvasContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { cleanupService } from './services/cleanup'
import backgroundImage from './assets/user_images/background_1.jpg'
import loginImage from './assets/user_images/login.jpg'

function App() {
  const { user, isLoading } = useAuth()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const documentId = 'default-document' // Default document ID
  const locateDropdownRef = useRef<LocateDropdownRef>(null)

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

  // Global keyboard shortcut for Locate dropdown (Ctrl+K / Cmd+K)
  useEffect(() => {
    if (!user) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      if ((e.key === 'k' || e.key === 'K') && isCtrlOrCmd) {
        e.preventDefault()
        locateDropdownRef.current?.openDropdown()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [user])

  if (isLoading) return null

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
    }}>
      {!user ? (
        <>
          {/* Background Image with Overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}>
            {/* Dark overlay for better contrast */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(62, 56, 50, 0.3)',
            }} />
          </div>

          {/* Content Container */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '60px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '80px',
              maxWidth: '1400px',
              width: '100%',
            }}>
              {/* Left side - login.jpg Image */}
              <div style={{
                flex: '0 0 auto',
                maxWidth: '500px',
              }}>
                <img
                  src={loginImage}
                  alt="Napkin Login"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </div>

              {/* Right side - Content Panel */}
              <div style={{
                flex: '1',
                maxWidth: '500px',
                background: 'rgba(250, 248, 243, 0.95)',
                borderRadius: '24px',
                padding: '60px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  fontSize: '16px',
                  color: '#8B7F74',
                  fontWeight: 400,
                  marginBottom: '16px',
                  letterSpacing: '0.5px',
                }}>
                  Best ideas start on a...
                </div>
                <h1 style={{
                  margin: 0,
                  fontSize: '72px',
                  fontWeight: 800,
                  color: '#3E3832',
                  letterSpacing: '-1px',
                  lineHeight: 1,
                  textShadow: '2px 2px 4px rgba(62, 56, 50, 0.15)',
                  marginBottom: '40px',
                }}>
                  Napkin
                </h1>
                
                <SignInButton />
                
                <div style={{
                  fontSize: '11px',
                  color: '#B5A89D',
                  marginTop: '32px',
                }}>
                  v{APP_VERSION}
                </div>
              </div>
            </div>
          </div>
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
                  background: '#FFFFFF',
                  position: 'fixed',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80%',
                  maxWidth: '1400px',
                  zIndex: 100,
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(62, 56, 50, 0.15)',
                  border: '1px solid #D4C5A9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#3E3832' }}>Napkin</h1>
                  <div style={{ fontSize: 11, color: '#6B5F54', marginTop: 2 }}>v{APP_VERSION}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TemplatesDropdown documentId={documentId} />
                  <ShapeSelector />
                  <StatsDropdown />
                  <LocateDropdown ref={locateDropdownRef} />
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
