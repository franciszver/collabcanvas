import styles from './CommandsWindow.module.css'

interface CommandsWindowProps {
  isOpen: boolean
  onClose: () => void
  onCommandSelect: (command: string) => void
}

interface CommandCategory {
  title: string
  commands: Command[]
}

interface Command {
  title: string
  description: string
  example: string
  parameters?: string[]
}

const commandCategories: CommandCategory[] = [
  {
    title: 'Create Shapes',
    commands: [
      {
        title: 'Create Circle',
        description: 'Create a circular shape',
        example: 'Create a blue circle',
        parameters: ['color', 'radius', 'x', 'y', 'rotation']
      },
      {
        title: 'Create Rectangle',
        description: 'Create a rectangular shape',
        example: 'Create a red rectangle',
        parameters: ['color', 'width', 'height', 'x', 'y', 'rotation']
      },
      {
        title: 'Create Text',
        description: 'Create a text element',
        example: 'Create text "Hello World"',
        parameters: ['text', 'color', 'fontSize', 'width', 'height', 'x', 'y', 'rotation']
      },
      {
        title: 'Create Triangle',
        description: 'Create a triangular shape',
        example: 'Create a yellow triangle',
        parameters: ['color', 'width', 'height', 'x', 'y', 'rotation']
      },
      {
        title: 'Create Star',
        description: 'Create a star shape',
        example: 'Create a purple star',
        parameters: ['color', 'width', 'height', 'x', 'y', 'rotation']
      },
      {
        title: 'Create Arrow',
        description: 'Create an arrow shape',
        example: 'Create an orange arrow',
        parameters: ['color', 'width', 'height', 'x', 'y', 'rotation']
      }
    ]
  },
  {
    title: 'Create Multiple Shapes',
    commands: [
      {
        title: 'Create Multiple Shapes',
        description: 'Create multiple shapes at once',
        example: 'Create 3 blue circles',
        parameters: ['count', 'color', 'target']
      },
      {
        title: 'Create Grid Layout',
        description: 'Create shapes in a grid pattern',
        example: 'Create grid of 3x3 circles',
        parameters: ['count', 'color', 'target', 'layout', 'rows', 'cols']
      },
      {
        title: 'Create Row Layout',
        description: 'Create shapes in a horizontal row',
        example: 'Create 5 blue rectangles in a row',
        parameters: ['count', 'color', 'target', 'layout']
      },
      {
        title: 'Create Column Layout',
        description: 'Create shapes in a vertical column',
        example: 'Create 4 green triangles in a column',
        parameters: ['count', 'color', 'target', 'layout']
      },
      {
        title: 'Create with Gradient',
        description: 'Create shapes with gradient colors',
        example: 'Create 5 circles with blue gradient',
        parameters: ['count', 'color', 'gradientDirection', 'gradientIntensity']
      }
    ]
  },
  {
    title: 'Manipulate Shapes',
    commands: [
      {
        title: 'Move Shapes',
        description: 'Move shapes to new positions',
        example: 'Move circle #1 to position 200, 300',
        parameters: ['selector', 'x', 'y']
      },
      {
        title: 'Resize Shapes',
        description: 'Change the size of shapes',
        example: 'Make rectangle #2 twice as big',
        parameters: ['selector', 'sizeMultiplier', 'relativeResize']
      },
      {
        title: 'Rotate Shapes',
        description: 'Rotate shapes by degrees',
        example: 'Rotate triangle #1 right',
        parameters: ['selector', 'rotationDirection', 'rotationDegrees']
      },
      {
        title: 'Change Color',
        description: 'Change the color of shapes',
        example: 'Change the blue circle to red',
        parameters: ['selector', 'color']
      },
      {
        title: 'Position by Anchor',
        description: 'Position shapes relative to anchors',
        example: 'Move circle #1 to center',
        parameters: ['selector', 'positionAnchor', 'offsetX', 'offsetY']
      }
    ]
  },
  {
    title: 'Layout Shapes',
    commands: [
      {
        title: 'Arrange in Row',
        description: 'Arrange selected shapes in a horizontal row',
        example: 'Arrange all circles in a row',
        parameters: ['selector', 'spacing']
      },
      {
        title: 'Arrange in Column',
        description: 'Arrange selected shapes in a vertical column',
        example: 'Arrange all rectangles in a column',
        parameters: ['selector', 'spacing']
      },
      {
        title: 'Arrange in Grid',
        description: 'Arrange selected shapes in a grid pattern',
        example: 'Arrange all circles in a 2x3 grid',
        parameters: ['selector', 'rows', 'cols', 'spacing']
      },
      {
        title: 'Arrange in Square Grid',
        description: 'Arrange shapes in a square grid (auto-calculated)',
        example: 'Arrange all rectangles in a square grid',
        parameters: ['selector', 'spacing']
      }
    ]
  }
]

const supportedColors = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'purple', 
  'pink', 'brown', 'black', 'white', 'gray', 'grey'
]

const supportedLayouts = ['row', 'column', 'grid']

const supportedGradients = ['lighter', 'darker', 'both']

const supportedAnchors = [
  'center', 'top', 'bottom', 'left', 'right', 
  'top-left', 'top-right', 'bottom-left', 'bottom-right'
]

export default function CommandsWindow({ isOpen, onClose, onCommandSelect }: CommandsWindowProps) {
  if (!isOpen) return null

  const handleCommandClick = (command: string) => {
    onCommandSelect(command)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.window} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>AI Commands Reference</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {commandCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              <div className={styles.commandsList}>
                {category.commands.map((command, commandIndex) => (
                  <div key={commandIndex} className={styles.commandItem}>
                    <div className={styles.commandHeader}>
                      <h4 className={styles.commandTitle}>{command.title}</h4>
                      <button
                        className={styles.useButton}
                        onClick={() => handleCommandClick(command.example)}
                      >
                        Use
                      </button>
                    </div>
                    <p className={styles.commandDescription}>{command.description}</p>
                    <div className={styles.commandExample}>
                      <strong>Example:</strong> "{command.example}"
                    </div>
                    {command.parameters && (
                      <div className={styles.commandParameters}>
                        <strong>Parameters:</strong> {command.parameters.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className={styles.referenceSection}>
            <h3 className={styles.sectionTitle}>Quick Reference</h3>
            
            <div className={styles.referenceGrid}>
              <div className={styles.referenceItem}>
                <h4>Colors</h4>
                <div className={styles.colorChips}>
                  {supportedColors.map((color, index) => (
                    <span key={index} className={styles.colorChip} style={{ backgroundColor: getColorValue(color) }}>
                      {color}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.referenceItem}>
                <h4>Layouts</h4>
                <div className={styles.layoutChips}>
                  {supportedLayouts.map((layout, index) => (
                    <span key={index} className={styles.layoutChip}>
                      {layout}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.referenceItem}>
                <h4>Gradients</h4>
                <div className={styles.gradientChips}>
                  {supportedGradients.map((gradient, index) => (
                    <span key={index} className={styles.gradientChip}>
                      {gradient}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.referenceItem}>
                <h4>Anchors</h4>
                <div className={styles.anchorChips}>
                  {supportedAnchors.map((anchor, index) => (
                    <span key={index} className={styles.anchorChip}>
                      {anchor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    'red': '#EF4444',
    'orange': '#F97316', 
    'yellow': '#EAB308',
    'green': '#22C55E',
    'blue': '#3B82F6',
    'indigo': '#6366F1',
    'violet': '#8B5CF6',
    'purple': '#8B5CF6',
    'pink': '#EC4899',
    'brown': '#A3A3A3',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#6B7280',
    'grey': '#6B7280'
  }
  return colorMap[colorName] || '#6B7280'
}
