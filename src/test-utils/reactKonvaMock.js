// Minimal react-konva mock for tests to avoid requiring node-canvas
const React = require('react')

function Stage(props) {
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
  const { onMouseMove, onMouseDown, onMouseUp, onWheel, onClick, ...rest } = props
  return React.createElement('div', {
    'data-testid': 'Stage',
    onMouseMove: wrapMouseMove(onMouseMove),
    onMouseDown: wrapMouseDown(onMouseDown),
    onMouseUp: wrapMouseUp(onMouseUp),
    onWheel: wrapWheel(onWheel),
    onClick: wrapClick(onClick),
    ...rest,
  })
}
function Layer(props) {
  return React.createElement('div', { 'data-testid': 'Layer', ...props })
}
function Rect(props) {
  const { onDragStart, onDragMove, onDragEnd, onClick, onTap, ...rest } = props
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
  return React.createElement('div', { 
    'data-testid': 'Rect', 
    onMouseDown: handleMouseDown, 
    onMouseMove: handleMouseMove, 
    onMouseUp: handleMouseUp, 
    onClick: handleClick, 
    onTap,
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    fill: props.fill,
    ...rest 
  })
}
function Transformer(props) {
  return React.createElement('div', { 'data-testid': 'Transformer', ...props })
}

function Text(props) {
  return React.createElement('div', { 'data-testid': 'Text', ...props })
}

function Circle(props) {
  const { onDragMove, onDragEnd, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  return React.createElement('div', { 'data-testid': 'Circle', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, ...rest })
}

function RegularPolygon(props) {
  const { onDragMove, onDragEnd, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  return React.createElement('div', { 'data-testid': 'RegularPolygon', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, ...rest })
}

function Star(props) {
  const { onDragMove, onDragEnd, ...rest } = props
  const handleMouseMove = (ev) => {
    if (onDragMove) onDragMove({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  const handleMouseUp = (ev) => {
    if (onDragEnd) onDragEnd({ target: { x: () => (ev.clientX || props.x), y: () => (ev.clientY || props.y) } })
  }
  return React.createElement('div', { 'data-testid': 'Star', onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, ...rest })
}

function Line(props) {
  return React.createElement('div', { 'data-testid': 'Line', ...props })
}

module.exports = { Stage, Layer, Rect, Transformer, Text, Circle, RegularPolygon, Star, Line }


