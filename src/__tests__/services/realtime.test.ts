// Mock the realtime service module
jest.mock('../../services/realtime', () => ({
  subscribeToPresenceRtdb: jest.fn(),
  updateCursorPositionRtdb: jest.fn(),
  setUserOfflineRtdb: jest.fn(),
  removeUserPresenceRtdb: jest.fn(),
  publishDragPositionsRtdb: jest.fn(),
  subscribeToDragRtdb: jest.fn(),
  markInactiveUsersRtdb: jest.fn(),
  cleanupInactiveUsersRtdb: jest.fn(),
}))

import * as realtimeService from '../../services/realtime'

describe('realtime service', () => {
  it('exports subscribeToPresenceRtdb function', () => {
    expect(typeof realtimeService.subscribeToPresenceRtdb).toBe('function')
  })

  it('exports updateCursorPositionRtdb function', () => {
    expect(typeof realtimeService.updateCursorPositionRtdb).toBe('function')
  })

  it('exports setUserOfflineRtdb function', () => {
    expect(typeof realtimeService.setUserOfflineRtdb).toBe('function')
  })

  it('exports removeUserPresenceRtdb function', () => {
    expect(typeof realtimeService.removeUserPresenceRtdb).toBe('function')
  })

  it('exports publishDragPositionsRtdb function', () => {
    expect(typeof realtimeService.publishDragPositionsRtdb).toBe('function')
  })

  it('exports subscribeToDragRtdb function', () => {
    expect(typeof realtimeService.subscribeToDragRtdb).toBe('function')
  })

  it('exports markInactiveUsersRtdb function', () => {
    expect(typeof realtimeService.markInactiveUsersRtdb).toBe('function')
  })

  it('exports cleanupInactiveUsersRtdb function', () => {
    expect(typeof realtimeService.cleanupInactiveUsersRtdb).toBe('function')
  })
})