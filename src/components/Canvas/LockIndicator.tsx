import React from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import type Konva from 'konva'

interface LockIndicatorProps {
  x: number
  y: number
  width: number
  height: number
  lockedBy: string
  lockedByName: string
  lockedAt: number
  isCurrentUser: boolean
  scale: number
}

export default function LockIndicator({
  x,
  y,
  width,
  height,
  lockedBy,
  lockedByName,
  isCurrentUser,
  scale
}: LockIndicatorProps) {
  // Position the lock icon in the top-right corner of the shape
  const lockX = x + width - 20
  const lockY = y + 5
  
  // Scale the lock icon based on canvas zoom
  const iconScale = Math.max(0.5, Math.min(1.5, 1 / scale))
  
  // Calculate tooltip position
  const tooltipX = lockX - 10
  const tooltipY = lockY - 30
  
  return (
    <Group>
      {/* Lock Icon Background Circle */}
      <Circle
        x={lockX}
        y={lockY}
        radius={8 * iconScale}
        fill={isCurrentUser ? '#10B981' : '#EF4444'}
        stroke="#FFFFFF"
        strokeWidth={1}
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      
      {/* Lock Icon Symbol */}
      <Text
        x={lockX - 4 * iconScale}
        y={lockY - 6 * iconScale}
        text="🔒"
        fontSize={10 * iconScale}
        fill="#FFFFFF"
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      
      {/* Tooltip Background */}
      <Rect
        x={tooltipX - 5}
        y={tooltipY - 20}
        width={Math.max(120, lockedByName.length * 7 + 20)}
        height={20}
        fill="rgba(0, 0, 0, 0.8)"
        cornerRadius={4}
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      
      {/* Tooltip Text */}
      <Text
        x={tooltipX}
        y={tooltipY - 15}
        text={`Locked by ${lockedByName}`}
        fontSize={10 * iconScale}
        fill="#FFFFFF"
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
    </Group>
  )
}

// Alternative simpler lock indicator (just the icon)
export function SimpleLockIndicator({
  x,
  y,
  width,
  height,
  isCurrentUser,
  scale
}: Omit<LockIndicatorProps, 'lockedBy' | 'lockedByName' | 'lockedAt'>) {
  const lockX = x + width - 15
  const lockY = y + 5
  const iconScale = Math.max(0.4, Math.min(1.2, 1 / scale))
  
  return (
    <Group>
      <Circle
        x={lockX}
        y={lockY}
        radius={6 * iconScale}
        fill={isCurrentUser ? '#10B981' : '#EF4444'}
        stroke="#FFFFFF"
        strokeWidth={1}
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
      <Text
        x={lockX - 3 * iconScale}
        y={lockY - 5 * iconScale}
        text="🔒"
        fontSize={8 * iconScale}
        fill="#FFFFFF"
        scaleX={iconScale}
        scaleY={iconScale}
        listening={false}
      />
    </Group>
  )
}
