import { render, screen } from '@testing-library/react'
import UserCursor from '../../components/Presence/UserCursor'

test('UserCursor renders with fallback name', () => {
  render(<UserCursor x={10} y={20} name={null} />)
  expect(screen.getByTestId('UserCursor')).toBeInTheDocument()
  expect(screen.getByText(/Unknown/)).toBeInTheDocument()
})


