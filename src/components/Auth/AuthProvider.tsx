import { AuthProvider as Provider } from '../../contexts/AuthContext'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // In test environments, the context might be mocked, so we need to handle that
  if (!Provider) {
    // Fallback for when the context is mocked - just render children
    return <>{children}</>
  }
  return <Provider>{children}</Provider>
}


