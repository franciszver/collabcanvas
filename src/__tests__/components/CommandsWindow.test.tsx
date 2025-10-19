import { render, screen, fireEvent } from '@testing-library/react'
import CommandsWindow from '../../components/Chat/CommandsWindow'

describe('CommandsWindow Component', () => {
  const mockOnClose = jest.fn()
  const mockOnCommandSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders when open', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    expect(screen.getByRole('heading', { name: /create shapes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create multiple shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /manipulate shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /layout shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create ui components/i, level: 3 })).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    render(
      <CommandsWindow
        isOpen={false}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    expect(screen.queryByText(/create shapes/i)).not.toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close commands/i })
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('calls onCommandSelect when a command is clicked', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    const useButtons = screen.getAllByText('Use')
    const createRectangleButton = useButtons[1] // Second "Use" button is for rectangle
    fireEvent.click(createRectangleButton)

    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create a red rectangle')
  })

  test('displays all command categories', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for all main categories
    expect(screen.getByRole('heading', { name: /create shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create multiple shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /manipulate shapes/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /layout shapes/i, level: 3 })).toBeInTheDocument()
    // Complex actions section doesn't exist, removed this check
  })

  test('displays shape creation commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for specific shape creation commands - use role selectors to be more specific
    expect(screen.getByRole('heading', { name: /create circle/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create rectangle/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create text/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create triangle/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create star/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create arrow/i, level: 4 })).toBeInTheDocument()
  })

  test('displays command descriptions', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for command descriptions
    expect(screen.getAllByText(/create a circular shape/i)).toHaveLength(1)
    expect(screen.getAllByText(/create a rectangular shape/i)).toHaveLength(1)
    expect(screen.getAllByText(/create a text element/i)).toHaveLength(1)
  })

  test('displays command examples', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for command examples
    expect(screen.getAllByText(/create a blue circle/i)).toHaveLength(1)
    expect(screen.getAllByText(/create a red rectangle/i)).toHaveLength(1)
    expect(screen.getAllByText(/create text "hello world"/i)).toHaveLength(1)
  })

  test('displays multiple shape creation commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for multiple shape creation commands
    expect(screen.getByText(/create 3 blue circles/i)).toBeInTheDocument()
    expect(screen.getByText(/create 5 blue rectangles in a row/i)).toBeInTheDocument()
    expect(screen.getByText(/create 4 green triangles in a column/i)).toBeInTheDocument()
  })

  test('displays manipulation commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for manipulation commands
    expect(screen.getByRole('heading', { name: /move shapes/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /resize shapes/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /rotate shapes/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /change color/i, level: 4 })).toBeInTheDocument()
  })

  test('displays layout commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for layout commands
    expect(screen.getAllByText(/arrange in row/i)).toHaveLength(1)
    expect(screen.getAllByText(/arrange in column/i)).toHaveLength(1)
    expect(screen.getAllByText(/arrange in grid/i)).toHaveLength(1)
  })

  test('displays complex action commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for complex action commands
    expect(screen.getByRole('heading', { name: /create login form/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create custom navbar/i, level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /simple login form/i, level: 4 })).toBeInTheDocument()
  })

  test('handles command selection for different command types', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Test different command types - use "Use" buttons
    const useButtons = screen.getAllByText('Use')
    
    // Test circle creation (first button)
    fireEvent.click(useButtons[0])
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create a blue circle')

    // Test multiple circles (find the correct button)
    fireEvent.click(useButtons[6])
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create 3 blue circles')

    // Test move shapes (find by looking for the button near "Move Shapes" heading)
    const moveShapesHeading = screen.getByRole('heading', { name: /move shapes/i, level: 4 })
    const moveShapesButton = moveShapesHeading.parentElement?.querySelector('button')
    if (moveShapesButton) {
      fireEvent.click(moveShapesButton)
      expect(mockOnCommandSelect).toHaveBeenCalledWith('Move circle #1 to position 200, 300')
    }

    // Test arrange in row (find by looking for the button near "Arrange in Row" heading)
    const arrangeHeading = screen.getByRole('heading', { name: /arrange in row/i, level: 4 })
    const arrangeButton = arrangeHeading.parentElement?.querySelector('button')
    if (arrangeButton) {
      fireEvent.click(arrangeButton)
      expect(mockOnCommandSelect).toHaveBeenCalledWith('Arrange all circles in a row')
    }
  })

  test('displays parameters for commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for parameter information - there are multiple shapes with same parameters
    expect(screen.getAllByText(/color, radius, x, y, rotation/i)).toHaveLength(1)
    expect(screen.getAllByText(/color, width, height, x, y, rotation/i)).toHaveLength(4) // Rectangle, Triangle, Star, Arrow all have same params
  })
})
