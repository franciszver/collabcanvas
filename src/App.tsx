import './App.css'
import { useAuth } from './contexts/AuthContext'
import SignInButton from './components/Auth/SignInButton'
import Canvas from './components/Canvas/Canvas'
import { CanvasProvider } from './contexts/CanvasContext'

function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  return (
    <div>
      {!user ? (
        <>
          <h1>Welcome to CollabCanvas</h1>
          <SignInButton />
        </>
      ) : (
        <CanvasProvider>
          <h1>Canvas</h1>
          <Canvas />
          <SignInButton />
        </CanvasProvider>
      )}
    </div>
  )
}

export default App
