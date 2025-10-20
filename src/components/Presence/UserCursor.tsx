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
  const targetPosRef = useRef({ x, y })
  const currentPosRef = useRef({ x, y })
  const isAnimatingRef = useRef(false)

  useEffect(() => {
    // Update target position
    targetPosRef.current = { x, y }
    
    // If not currently animating, start animation
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true
      
      const animate = () => {
        const current = currentPosRef.current
        const target = targetPosRef.current
        
        // Calculate distance to target
        const dx = target.x - current.x
        const dy = target.y - current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // If we're close enough, snap to target and stop
        if (distance < 0.5) {
          currentPosRef.current = { ...target }
          setDisplayPos({ ...target })
          isAnimatingRef.current = false
          return
        }
        
        // Smooth interpolation with easing (lerp with factor 0.2 for smooth following)
        const lerpFactor = 0.2
        currentPosRef.current = {
          x: current.x + dx * lerpFactor,
          y: current.y + dy * lerpFactor
        }
        
        setDisplayPos({ ...currentPosRef.current })
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [x, y])

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


