import { Group, Circle, Text } from 'react-konva'
import type { Rectangle } from '../../types/canvas.types'
import { hasComment, hasActivity } from '../../services/activityService'

interface ActivityBadgeProps {
  shape: Rectangle
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export default function ActivityBadge({ shape, x, y, width, height, scale }: ActivityBadgeProps) {
  const showComment = hasComment(shape)
  const showActivity = hasActivity(shape)

  // Don't show badge if no activity
  if (!showComment && !showActivity) {
    return null
  }

  // Badge size adjusted for zoom level
  const badgeSize = 24 / scale
  const badgePadding = 8 / scale
  
  // Position in top-right corner
  const badgeX = x + width - badgePadding
  const badgeY = y + badgePadding

  // Choose icon and color based on activity type
  const icon = showComment ? '💬' : '📝'
  const bgColor = showComment ? '#5B8FA3' : '#9B8D7F'
  const textColor = '#FFFFFF'

  // Count of activity entries
  const count = shape.history?.length || 0

  return (
    <Group>
      {/* Badge background circle */}
      <Circle
        x={badgeX}
        y={badgeY}
        radius={badgeSize / 2}
        fill={bgColor}
        stroke="#FFFFFF"
        strokeWidth={2 / scale}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={4 / scale}
        shadowOffset={{ x: 0, y: 2 / scale }}
        listening={false}
      />
      
      {/* Icon text */}
      <Text
        x={badgeX - badgeSize / 2}
        y={badgeY - badgeSize / 2}
        width={badgeSize}
        height={badgeSize}
        text={icon}
        fontSize={12 / scale}
        fill={textColor}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      
      {/* Optional count badge for multiple entries */}
      {count > 1 && (
        <>
          <Circle
            x={badgeX + badgeSize / 3}
            y={badgeY - badgeSize / 3}
            radius={10 / scale}
            fill="#B07768"
            stroke="#FFFFFF"
            strokeWidth={1.5 / scale}
            listening={false}
          />
          <Text
            x={badgeX + badgeSize / 3 - 8 / scale}
            y={badgeY - badgeSize / 3 - 8 / scale}
            width={16 / scale}
            height={16 / scale}
            text={count > 9 ? '9+' : count.toString()}
            fontSize={9 / scale}
            fill="#FFFFFF"
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            listening={false}
          />
        </>
      )}
    </Group>
  )
}

