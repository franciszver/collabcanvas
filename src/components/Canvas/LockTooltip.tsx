import React from 'react'
import { Group, Rect, Text } from 'react-konva'

interface LockTooltipProps {
  x: number
  y: number
  text: string
  scale: number
  visible: boolean
}

export default function LockTooltip({ x, y, text, scale, visible }: LockTooltipProps) {
  if (!visible) return null

  const tooltipWidth = Math.max(120, text.length * 7 + 20)
  const tooltipHeight = 24
  const iconScale = Math.max(0.5, Math.min(1.5, 1 / scale))

  return (
    <Group>
      {/* Tooltip Background */}
      <Rect
        x={x - tooltipWidth / 2}
        y={y - tooltipHeight - 10}
        width={tooltipWidth}
        height={tooltipHeight}
        fill="rgba(0, 0, 0, 0.8)"
        cornerRadius={6}
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      
      {/* Tooltip Arrow */}
      <Rect
        x={x - 4}
        y={y - 6}
        width={8}
        height={8}
        fill="rgba(0, 0, 0, 0.8)"
        rotation={45}
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      
      {/* Tooltip Text */}
      <Text
        x={x - tooltipWidth / 2 + 10}
        y={y - tooltipHeight - 5}
        text={text}
        fontSize={12 * iconScale}
        fill="#FFFFFF"
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
    </Group>
  )
}
