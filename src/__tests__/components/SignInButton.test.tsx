import { render } from '@testing-library/react'
import SignInButton from '../../components/Auth/SignInButton'

describe('SignInButton', () => {
  it('renders placeholder without crashing', () => {
    render(<SignInButton />)
  })
})


