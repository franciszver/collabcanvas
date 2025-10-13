// Minimal react-konva mock for tests to avoid requiring node-canvas
const React = require('react')

function Stage(props) {
  return React.createElement('div', { 'data-testid': 'Stage', ...props })
}
function Layer(props) {
  return React.createElement('div', { 'data-testid': 'Layer', ...props })
}

module.exports = { Stage, Layer }


