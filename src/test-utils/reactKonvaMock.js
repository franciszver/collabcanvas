// Minimal react-konva mock for tests to avoid requiring node-canvas
const React = require('react')

const Stage = React.forwardRef((props, ref) => {
  const wrapMouseMove = (handler) => (ev) => {
    if (!handler) return
    const stage = {
      getPointerPosition: () => ({ x: ev.clientX || 0, y: ev.clientY || 0 }),
      getStage: () => stage,
    }
    handler({ target: stage })
  }
  const wrapMouseDown = (handler) => (ev) => {
    if (!handler) return
    const stage = {
      getPointerPosition: () => ({ x: ev.clientX || 0, y: ev.clientY || 0 }),
      getStage: () => stage,
    }
    handler({ target: stage })
  }
  const wrapMouseUp = (handler) => (ev) => {
    if (!handler) return
    const stage = {
      getPointerPosition: () => ({ x: ev.clientX || 0, y: ev.clientY || 0 }),
      getStage: () => stage,
    }
    handler({ target: stage })
  }
  const wrapWheel = (handler) => (ev) => {
    if (!handler) return
    const stage = {
      getPointerPosition: () => ({ x: ev.clientX || 0, y: ev.clientY || 0 }),
      getStage: () => stage,
    }
    handler({ evt: { preventDefault: () => {}, deltaY: ev.deltaY || 1 }, target: stage })
  }
  const wrapClick = (handler) => (ev) => {
    if (!handler) return
    const stage = {
      getPointerPosition: () => ({ x: ev.clientX || 0, y: ev.clientY || 0 }),
      getStage: () => stage,
    }
    handler({ target: stage })
  }
  const { onMouseMove, onMouseDown, onMouseUp, onWheel, onClick, scaleX, scaleY, ...rest } = props
  return React.createElement('div', {
    'data-testid': 'Stage',
    ref,
    onMouseMove: wrapMouseMove(onMouseMove),
    onMouseDown: wrapMouseDown(onMouseDown),
    onMouseUp: wrapMouseUp(onMouseUp),
    onWheel: wrapWheel(onWheel),
    onClick: wrapClick(onClick),
    scalex: scaleX,
    scaley: scaleY,
    ...rest,
  })
})
function Layer(props) {
  const { listening, ...rest } = props
  return React.createElement('div', { 
    'data-testid': 'Layer', 
    listening: listening ? 'true' : 'false',
    ...rest 
  })
}
function Rect(props) {
  const { onDragStart, onDragMove, onDragEnd, onClick, onTap, onMouseEnter, onMouseLeave, onTransformEnd, perfectDrawEnabled, shadowForStrokeEnabled, ...rest } = props
  const handleMouseDown = (ev) => {
    if (onDragStart) onDragStart({ target: { x: () => props.x, y: () => props.y } })
  }
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleClick = (ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation()
    if (onClick) onClick({ target: { x: () => props.x, y: () => props.y } })
  }
  const handleTap = (ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation()
    if (onTap) onTap({ target: { x: () => props.x, y: () => props.y } })
  }
  const handleMouseEnter = (ev) => {
    if (onMouseEnter) onMouseEnter({ target: { x: () => props.x, y: () => props.y } })
  }
  const handleMouseLeave = (ev) => {
    if (onMouseLeave) onMouseLeave({ target: { x: () => props.x, y: () => props.y } })
  }
  const handleTransformEnd = (ev) => {
    if (onTransformEnd) onTransformEnd({ target: { x: () => props.x, y: () => props.y } })
  }
  return React.createElement('div', { 
    'data-testid': 'Rect', 
    onMouseDown: handleMouseDown, 
    onMouseMove: handleMouseMove, 
    onMouseUp: handleMouseUp, 
    onClick: handleClick,
    onTap: handleTap,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTransformEnd: handleTransformEnd,
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    fill: props.fill,
    ...rest 
  })
}
const Transformer = React.forwardRef((props, ref) => {
  const { rotateEnabled, ignoreStroke, ...rest } = props
  return React.createElement('div', { 
    'data-testid': 'Transformer', 
    ref,
    rotateenabled: rotateEnabled ? 'true' : 'false',
    ignorestroke: ignoreStroke ? 'true' : 'false',
    ...rest 
  })
})

function Text(props) {
  return React.createElement('div', { 'data-testid': 'Text', ...props })
}

function Circle(props) {
  const { onDragMove, onDragEnd, onTransformEnd, perfectDrawEnabled, shadowForStrokeEnabled, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleTransformEnd = (ev) => {
    if (onTransformEnd) onTransformEnd({ target: { x: () => props.x, y: () => props.y } })
  }
  return React.createElement('div', { 'data-testid': 'Circle', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onTransformEnd: handleTransformEnd, ...rest })
}

function RegularPolygon(props) {
  const { onDragMove, onDragEnd, onTransformEnd, perfectDrawEnabled, shadowForStrokeEnabled, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleTransformEnd = (ev) => {
    if (onTransformEnd) onTransformEnd({ target: { x: () => props.x, y: () => props.y } })
  }
  return React.createElement('div', { 'data-testid': 'RegularPolygon', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onTransformEnd: handleTransformEnd, ...rest })
}

function Star(props) {
  const { onDragMove, onDragEnd, onTransformEnd, perfectDrawEnabled, shadowForStrokeEnabled, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleTransformEnd = (ev) => {
    if (onTransformEnd) onTransformEnd({ target: { x: () => props.x, y: () => props.y } })
  }
  return React.createElement('div', { 'data-testid': 'Star', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onTransformEnd: handleTransformEnd, ...rest })
}

function Line(props) {
  return React.createElement('div', { 'data-testid': 'Line', ...props })
}

function Arrow(props) {
  const { onDragMove, onDragEnd, onTransformEnd, perfectDrawEnabled, shadowForStrokeEnabled, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleTransformEnd = (ev) => {
    if (onTransformEnd) onTransformEnd({ target: { x: () => props.x, y: () => props.y } })
  }
  return React.createElement('div', { 'data-testid': 'Arrow', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onTransformEnd: handleTransformEnd, ...rest })
}

module.exports = { Stage, Layer, Rect, Transformer, Text, Circle, RegularPolygon, Star, Line, Arrow }


