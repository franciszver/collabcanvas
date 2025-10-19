import { useCallback } from 'react'
import { useCanvas } from '../../contexts/CanvasContext'
import { MIN_SCALE, MAX_SCALE } from '../../utils/constants'

interface ZoomControlsProps {
  containerWidth: number
  containerHeight: number
}

export default function ZoomControls({ containerWidth, containerHeight }: ZoomControlsProps) {
  const { viewport, setViewport, rectangles } = useCanvas()
  
  const currentZoom = Math.round(viewport.scale * 100)
  const isAtMinZoom = viewport.scale <= MIN_SCALE
  const isAtMaxZoom = viewport.scale >= MAX_SCALE

  // Zoom in by 20%
  const handleZoomIn = useCallback(() => {
    if (isAtMaxZoom) return
    
    const oldScale = viewport.scale
    const newScale = Math.min(MAX_SCALE, oldScale * 1.2)
    
    // Center zoom on viewport center
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    
    const mousePointTo = {
      x: (centerX - viewport.x) / oldScale,
      y: (centerY - viewport.y) / oldScale,
    }
    
    const newX = centerX - mousePointTo.x * newScale
    const newY = centerY - mousePointTo.y * newScale
    
    setViewport({ scale: newScale, x: newX, y: newY })
  }, [viewport, containerWidth, containerHeight, setViewport, isAtMaxZoom])

  // Zoom out by 20%
  const handleZoomOut = useCallback(() => {
    if (isAtMinZoom) return
    
    const oldScale = viewport.scale
    const newScale = Math.max(MIN_SCALE, oldScale / 1.2)
    
    // Center zoom on viewport center
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    
    const mousePointTo = {
      x: (centerX - viewport.x) / oldScale,
      y: (centerY - viewport.y) / oldScale,
    }
    
    const newX = centerX - mousePointTo.x * newScale
    const newY = centerY - mousePointTo.y * newScale
    
    setViewport({ scale: newScale, x: newX, y: newY })
  }, [viewport, containerWidth, containerHeight, setViewport, isAtMinZoom])

  // Reset zoom to 100%
  const handleResetZoom = useCallback(() => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    
    const mousePointTo = {
      x: (centerX - viewport.x) / viewport.scale,
      y: (centerY - viewport.y) / viewport.scale,
    }
    
    const newX = centerX - mousePointTo.x * 1
    const newY = centerY - mousePointTo.y * 1
    
    setViewport({ scale: 1, x: newX, y: newY })
  }, [viewport, containerWidth, containerHeight, setViewport])

  // Fit all shapes in view
  const handleFitToScreen = useCallback(() => {
    if (rectangles.length === 0) {
      // No shapes - reset to default view
      setViewport({ scale: 1, x: 0, y: 0 })
      return
    }

    // Calculate bounding box for all shapes (handling different coordinate systems)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    rectangles.forEach(shape => {
      let shapeMinX: number, shapeMinY: number, shapeMaxX: number, shapeMaxY: number

      // Handle different shape coordinate systems
      if (shape.type === 'circle' || shape.type === 'triangle' || shape.type === 'star') {
        // These shapes use center coordinates in rendering
        const centerX = shape.x + shape.width / 2
        const centerY = shape.y + shape.height / 2
        const radius = Math.max(shape.width, shape.height) / 2
        
        shapeMinX = centerX - radius
        shapeMinY = centerY - radius
        shapeMaxX = centerX + radius
        shapeMaxY = centerY + radius
      } else {
        // Rectangles, arrows, text use top-left coordinates
        shapeMinX = shape.x
        shapeMinY = shape.y
        shapeMaxX = shape.x + shape.width
        shapeMaxY = shape.y + shape.height
      }

      minX = Math.min(minX, shapeMinX)
      minY = Math.min(minY, shapeMinY)
      maxX = Math.max(maxX, shapeMaxX)
      maxY = Math.max(maxY, shapeMaxY)
    })

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Add 10% padding on all sides
    const paddingFactor = 0.1
    const paddedWidth = contentWidth * (1 + 2 * paddingFactor)
    const paddedHeight = contentHeight * (1 + 2 * paddingFactor)

    // Calculate scale to fit content within viewport
    const scaleX = containerWidth / paddedWidth
    const scaleY = containerHeight / paddedHeight
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(scaleX, scaleY)))

    // Calculate center of content
    const contentCenterX = minX + contentWidth / 2
    const contentCenterY = minY + contentHeight / 2

    // Center the content in viewport
    const newX = containerWidth / 2 - contentCenterX * newScale
    const newY = containerHeight / 2 - contentCenterY * newScale

    setViewport({ scale: newScale, x: newX, y: newY })
  }, [rectangles, containerWidth, containerHeight, setViewport])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '48px',
        right: '16px',
        zIndex: 30,
        background: '#FFFFFF',
        border: '1px solid #D4C5A9',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(62, 56, 50, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        disabled={isAtMaxZoom}
        title="Zoom in (+20%)"
        style={{
          background: isAtMaxZoom ? '#F5F5F5' : '#FFFFFF',
          border: 'none',
          borderBottom: '1px solid #D4C5A9',
          padding: '10px 16px',
          cursor: isAtMaxZoom ? 'not-allowed' : 'pointer',
          color: isAtMaxZoom ? '#B5A89D' : '#3E3832',
          fontSize: '18px',
          fontWeight: '600',
          transition: 'background 0.15s ease',
          width: '48px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isAtMaxZoom) {
            e.currentTarget.style.background = '#F0ECE3'
          }
        }}
        onMouseLeave={(e) => {
          if (!isAtMaxZoom) {
            e.currentTarget.style.background = '#FFFFFF'
          }
        }}
      >
        +
      </button>

      {/* Current Zoom Display - Clickable to reset to 100% */}
      <button
        onClick={handleResetZoom}
        title="Reset to 100%"
        style={{
          background: '#FFFFFF',
          border: 'none',
          borderBottom: '1px solid #D4C5A9',
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#3E3832',
          fontSize: '12px',
          fontWeight: '500',
          transition: 'background 0.15s ease',
          width: '48px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F0ECE3'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
      >
        {currentZoom}%
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        disabled={isAtMinZoom}
        title="Zoom out (-20%)"
        style={{
          background: isAtMinZoom ? '#F5F5F5' : '#FFFFFF',
          border: 'none',
          borderBottom: '1px solid #D4C5A9',
          padding: '10px 16px',
          cursor: isAtMinZoom ? 'not-allowed' : 'pointer',
          color: isAtMinZoom ? '#B5A89D' : '#3E3832',
          fontSize: '18px',
          fontWeight: '600',
          transition: 'background 0.15s ease',
          width: '48px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isAtMinZoom) {
            e.currentTarget.style.background = '#F0ECE3'
          }
        }}
        onMouseLeave={(e) => {
          if (!isAtMinZoom) {
            e.currentTarget.style.background = '#FFFFFF'
          }
        }}
      >
        −
      </button>

      {/* Fit to Screen Button */}
      <button
        onClick={handleFitToScreen}
        title="Fit all shapes in view"
        style={{
          background: '#FFFFFF',
          border: 'none',
          padding: '10px 16px',
          cursor: 'pointer',
          color: '#5B8FA3',
          fontSize: '18px',
          fontWeight: '600',
          transition: 'background 0.15s ease',
          width: '48px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#F0ECE3'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#FFFFFF'
        }}
      >
        ⊕
      </button>
    </div>
  )
}

