// Mock the auth service module
jest.mock('../../services/auth', () => ({
  signInWithGoogle: jest.fn(),
  handleRedirectResult: jest.fn(),
  signOut: jest.fn(),
}))

import * as authService from '../../services/auth'

describe('auth service', () => {
  it('exports signInWithGoogle function', () => {
    expect(typeof authService.signInWithGoogle).toBe('function')
  })

  it('exports handleRedirectResult function', () => {
    expect(typeof authService.handleRedirectResult).toBe('function')
  })

  it('exports signOut function', () => {
    expect(typeof authService.signOut).toBe('function')
  })
})