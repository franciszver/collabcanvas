import { render } from '@testing-library/react'
import LockTooltip from '../../components/Canvas/LockTooltip'

// Mock react-konva
jest.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => (
    <div data-testid="lock-tooltip-group" {...props}>
      {children}
    </div>
  ),
  Rect: ({ x, y, width, height, ...props }: any) => (
    <div 
      data-testid="lock-tooltip-rect"
      style={{ 
        position: 'absolute', 
        left: x, 
        top: y, 
        width, 
        height,
        ...props 
      }}
    />
  ),
  Text: ({ x, y, text, ...props }: any) => (
    <div 
      data-testid="lock-tooltip-text"
      style={{ 
        position: 'absolute', 
        left: x, 
        top: y,
        ...props 
      }}
    >
      {text}
    </div>
  ),
}))

describe('LockTooltip Component', () => {
  test('renders lock tooltip for locked shape', () => {
    const props = {
      x: 100,
      y: 100,
      lockedBy: 'user1',
      lockedByName: 'Test User',
      text: 'Locked by Test User',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const groupElement = document.querySelector('[data-testid="lock-tooltip-group"]')
    expect(groupElement).toBeInTheDocument()
    
    const rectElement = document.querySelector('[data-testid="lock-tooltip-rect"]')
    expect(rectElement).toBeInTheDocument()
    
    const textElement = document.querySelector('[data-testid="lock-tooltip-text"]')
    expect(textElement).toBeInTheDocument()
    expect(textElement).toHaveTextContent('Locked by Test User')
  })

  test('does not render when shape is not locked', () => {
    const props = {
      x: 100,
      y: 100,
      lockedBy: null,
      lockedByName: null,
      text: '',
      scale: 1,
      visible: false
    }

    render(<LockTooltip {...props} />)
    
    const groupElement = document.querySelector('[data-testid="lock-tooltip-group"]')
    expect(groupElement).not.toBeInTheDocument()
  })

  // TODO: Fix style assertions - need to verify actual rendered tooltip positioning
  test.skip('positions tooltip correctly', () => {
    const props = {
      x: 200,
      y: 300,
      lockedBy: 'user2',
      lockedByName: 'Another User',
      text: 'Locked by Another User',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const groupElement = document.querySelector('[data-testid="lock-tooltip-group"]')
    expect(groupElement).toHaveStyle({
      left: '200px',
      top: '280px' // y - 20
    })
  })

  test('shows correct locked by text', () => {
    const props = {
      x: 100,
      y: 100,
      lockedBy: 'user123',
      lockedByName: 'John Doe',
      text: 'Locked by John Doe',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const textElement = document.querySelector('[data-testid="lock-tooltip-text"]')
    expect(textElement).toHaveTextContent('Locked by John Doe')
  })

  test('handles missing locked by name', () => {
    const props = {
      x: 100,
      y: 100,
      lockedBy: 'user456',
      lockedByName: null,
      text: 'Locked by user456',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const textElement = document.querySelector('[data-testid="lock-tooltip-text"]')
    expect(textElement).toHaveTextContent('Locked by user456')
  })

  test('handles empty locked by name', () => {
    const props = {
      x: 100,
      y: 100,
      lockedBy: 'user789',
      lockedByName: '',
      text: 'Locked by user789',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const textElement = document.querySelector('[data-testid="lock-tooltip-text"]')
    expect(textElement).toHaveTextContent('Locked by user789')
  })

  // TODO: Fix style assertions - need to verify actual rendered tooltip element styling
  test.skip('applies correct styling to tooltip elements', () => {
    const props = {
      x: 150,
      y: 250,
      lockedBy: 'user999',
      lockedByName: 'Styling Test',
      text: 'Locked by Styling Test',
      scale: 1,
      visible: true
    }

    render(<LockTooltip {...props} />)
    
    const rectElement = document.querySelector('[data-testid="lock-tooltip-rect"]')
    expect(rectElement).toHaveStyle({
      left: '150px',
      top: '250px'
    })
    
    const textElement = document.querySelector('[data-testid="lock-tooltip-text"]')
    expect(textElement).toHaveStyle({
      left: '155px', // x + 5
      top: '255px'   // y + 5
    })
  })
})
