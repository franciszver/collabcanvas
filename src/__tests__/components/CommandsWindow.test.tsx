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

    expect(screen.getByText(/create shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/create multiple shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/manipulate shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/layout shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/complex actions/i)).toBeInTheDocument()
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

    const closeButton = screen.getByTitle(/close commands/i)
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

    const createRectangleButton = screen.getByText(/create rectangle/i)
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
    expect(screen.getByText(/create shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/create multiple shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/manipulate shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/layout shapes/i)).toBeInTheDocument()
    expect(screen.getByText(/complex actions/i)).toBeInTheDocument()
  })

  test('displays shape creation commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for specific shape creation commands - use getAllByText to handle multiple occurrences
    expect(screen.getAllByText(/create circle/i)).toHaveLength(1)
    expect(screen.getAllByText(/create rectangle/i)).toHaveLength(1)
    expect(screen.getAllByText(/create text/i)).toHaveLength(1)
    expect(screen.getAllByText(/create triangle/i)).toHaveLength(1)
    expect(screen.getAllByText(/create star/i)).toHaveLength(1)
    expect(screen.getAllByText(/create arrow/i)).toHaveLength(1)
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
    expect(screen.getAllByText(/create 5 circles/i)).toHaveLength(1)
    expect(screen.getAllByText(/create 3 rectangles/i)).toHaveLength(1)
    expect(screen.getAllByText(/create 4 triangles/i)).toHaveLength(1)
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
    expect(screen.getAllByText(/move shape/i)).toHaveLength(1)
    expect(screen.getAllByText(/resize shape/i)).toHaveLength(1)
    expect(screen.getAllByText(/rotate shape/i)).toHaveLength(1)
    expect(screen.getAllByText(/change color/i)).toHaveLength(1)
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
    expect(screen.getAllByText(/create form/i)).toHaveLength(1)
    expect(screen.getAllByText(/create navbar/i)).toHaveLength(1)
    expect(screen.getAllByText(/create card/i)).toHaveLength(1)
  })

  test('handles command selection for different command types', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Test different command types
    const createCircleButton = screen.getByText(/create circle/i)
    fireEvent.click(createCircleButton)
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create a blue circle')

    const createMultipleButton = screen.getByText(/create 5 circles/i)
    fireEvent.click(createMultipleButton)
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create 5 blue circles')

    const moveShapeButton = screen.getByText(/move shape/i)
    fireEvent.click(moveShapeButton)
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Move the selected shape to x: 100, y: 200')

    const arrangeRowButton = screen.getByText(/arrange in row/i)
    fireEvent.click(arrangeRowButton)
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Arrange all shapes in a row')

    const createFormButton = screen.getByText(/create form/i)
    fireEvent.click(createFormButton)
    expect(mockOnCommandSelect).toHaveBeenCalledWith('Create a contact form')
  })

  test('displays parameters for commands', () => {
    render(
      <CommandsWindow
        isOpen={true}
        onClose={mockOnClose}
        onCommandSelect={mockOnCommandSelect}
      />
    )

    // Check for parameter information - use getAllByText to handle multiple occurrences
    expect(screen.getAllByText(/color, radius, x, y, rotation/i)).toHaveLength(1)
    expect(screen.getAllByText(/color, width, height, x, y, rotation/i)).toHaveLength(1)
  })
})
