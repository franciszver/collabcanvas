import { createContext, useContext } from 'react'

// Placeholder for PR #1
export interface CanvasContextValue {}

const CanvasContext = createContext<CanvasContextValue | undefined>(undefined)

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext)
  if (!ctx) throw new Error('useCanvas must be used within CanvasProvider')
  return ctx
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return <CanvasContext.Provider value={{}}>{children}</CanvasContext.Provider>
}


