import { useEffect, useRef, useState } from 'react'

interface UserCursorProps {
  x: number
  y: number
  name: string | null
  isActive?: boolean
}

export default function UserCursor({ x, y, name, isActive = true }: UserCursorProps) {
  const [displayPos, setDisplayPos] = useState({ x, y })
  const animationRef = useRef<number>()
  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateRef.current
    
    // Only interpolate if enough time has passed (cursor is moving)
    if (timeSinceLastUpdate > 50) {
      lastUpdateRef.current = now
      
      // Cancel previous animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      // Smooth interpolation to new position
      const startPos = { ...displayPos }
      const targetPos = { x, y }
      const startTime = now
      const duration = 150 // 150ms interpolation
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Ease-out interpolation
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        setDisplayPos({
          x: startPos.x + (targetPos.x - startPos.x) * easeOut,
          y: startPos.y + (targetPos.y - startPos.y) * easeOut
        })
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    } else {
      // For rapid updates, update immediately
      setDisplayPos({ x, y })
    }
  }, [x, y, displayPos])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  if (!isActive) return null

  return (
    <div 
      data-testid="UserCursor" 
      style={{ 
        position: 'absolute', 
        left: displayPos.x, 
        top: displayPos.y, 
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <div style={{ 
        width: 8, 
        height: 8, 
        background: '#3B82F6', 
        borderRadius: '9999px', 
        boxShadow: '0 0 0 2px #ffffff',
        animation: 'pulse 2s infinite'
      }} />
      <div style={{ 
        marginTop: 4, 
        fontSize: 10, 
        color: '#E5E7EB', 
        textShadow: '0 0 2px #000',
        whiteSpace: 'nowrap',
        fontWeight: 500
      }}>
        {name ?? 'Unknown'}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}


