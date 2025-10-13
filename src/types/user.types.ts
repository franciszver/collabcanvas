export interface AuthUserProfile {
  id: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export interface AuthState {
  user: AuthUserProfile | null
  isLoading: boolean
  error: string | null
}


