import { useMemo } from 'react'
import { Rect, Group } from 'react-konva'
import type { Rectangle } from '../../types/canvas.types'

interface SelectionBoundsProps {
  selectedShapes: Rectangle[]
  visible: boolean
}

export default function SelectionBounds({ selectedShapes, visible }: SelectionBoundsProps) {
  // Memoize bounds calculation for performance
  const bounds = useMemo(() => {
    if (selectedShapes.length === 0) return null

    return selectedShapes.reduce((acc, shape) => {
      const right = shape.x + shape.width
      const bottom = shape.y + shape.height
      
      if (acc.minX === null || shape.x < acc.minX) acc.minX = shape.x
      if (acc.minY === null || shape.y < acc.minY) acc.minY = shape.y
      if (acc.maxX === null || right > acc.maxX) acc.maxX = right
      if (acc.maxY === null || bottom > acc.maxY) acc.maxY = bottom
      
      return acc
    }, {
      minX: null as number | null,
      minY: null as number | null,
      maxX: null as number | null,
      maxY: null as number | null
    })
  }, [selectedShapes])

  if (!visible || !bounds || bounds.minX === null || bounds.minY === null || bounds.maxX === null || bounds.maxY === null) {
    return null
  }

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  return (
    <Group>
      {/* Selection bounds outline */}
      <Rect
        x={bounds.minX - 2}
        y={bounds.minY - 2}
        width={width + 4}
        height={height + 4}
        stroke="#3B82F6"
        strokeWidth={2}
        fill="transparent"
        dash={[5, 5]}
        listening={false}
      />
      
      {/* Corner handles */}
      {[
        { x: bounds.minX - 2, y: bounds.minY - 2 }, // Top-left
        { x: bounds.maxX + 2, y: bounds.minY - 2 }, // Top-right
        { x: bounds.minX - 2, y: bounds.maxY + 2 }, // Bottom-left
        { x: bounds.maxX + 2, y: bounds.maxY + 2 }, // Bottom-right
      ].map((corner, index) => (
        <Rect
          key={index}
          x={corner.x - 3}
          y={corner.y - 3}
          width={6}
          height={6}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={1}
          listening={false}
        />
      ))}
    </Group>
  )
}
