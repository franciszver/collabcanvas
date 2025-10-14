import { render, screen } from '@testing-library/react'
import AppLayout from '../../components/Layout/AppLayout'

test('AppLayout renders children', () => {
  render(
    <AppLayout>
      <div data-testid="child">Hello</div>
    </AppLayout>
  )
  expect(screen.getByTestId('child')).toBeInTheDocument()
})


