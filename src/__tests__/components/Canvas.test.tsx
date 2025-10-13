import { render } from '@testing-library/react'
import Canvas from '../../components/Canvas/Canvas'

describe('Canvas', () => {
  it('renders placeholder without crashing', () => {
    render(<Canvas />)
  })
})


