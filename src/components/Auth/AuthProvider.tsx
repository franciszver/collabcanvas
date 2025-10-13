import { AuthProvider as Provider } from '../../contexts/AuthContext'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>
}


