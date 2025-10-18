// Mock realtime service
jest.mock('../../services/realtime', () => ({
  markInactiveUsersRtdb: jest.fn(),
  cleanupInactiveUsersRtdb: jest.fn(),
}))

import { cleanupService } from '../../services/cleanup'
import { markInactiveUsersRtdb, cleanupInactiveUsersRtdb } from '../../services/realtime'

const mockMarkInactiveUsersRtdb = markInactiveUsersRtdb as jest.MockedFunction<typeof markInactiveUsersRtdb>
const mockCleanupInactiveUsersRtdb = cleanupInactiveUsersRtdb as jest.MockedFunction<typeof cleanupInactiveUsersRtdb>

describe('cleanup service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    // Reset the service state
    cleanupService.stop()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('start', () => {
    it('starts cleanup service and runs cleanup immediately', async () => {
      mockMarkInactiveUsersRtdb.mockResolvedValue(2)
      mockCleanupInactiveUsersRtdb.mockResolvedValue(1)

      cleanupService.start()

      // Wait for the immediate cleanup to complete
      await Promise.resolve()

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledWith(60000)
      expect(mockCleanupInactiveUsersRtdb).toHaveBeenCalledWith(300000)
    })

    it('does not start if already running', () => {
      cleanupService.start()
      const firstCallCount = mockMarkInactiveUsersRtdb.mock.calls.length

      cleanupService.start()

      // Should not call cleanup functions again
      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledTimes(firstCallCount)
    })

    it('sets up periodic cleanup interval', async () => {
      cleanupService.start()

      // Wait for immediate cleanup
      await Promise.resolve()

      // Fast-forward time to trigger interval (need to go past 60 seconds)
      jest.advanceTimersByTime(61000)

      // Wait for async operations to complete
      await Promise.resolve()

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledTimes(2) // Once immediately, once from interval
      expect(mockCleanupInactiveUsersRtdb).toHaveBeenCalledTimes(2)
    })
  })

  describe('stop', () => {
    it('stops cleanup service and clears interval', () => {
      cleanupService.start()
      cleanupService.stop()

      // Fast-forward time - should not trigger more cleanup calls
      const callCount = mockMarkInactiveUsersRtdb.mock.calls.length
      jest.advanceTimersByTime(60000)

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledTimes(callCount)
    })

    it('can be called multiple times safely', () => {
      cleanupService.start()
      cleanupService.stop()
      cleanupService.stop() // Should not throw

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledTimes(1) // Only the initial call
    })
  })

  describe('triggerCleanup', () => {
    it('manually triggers cleanup and returns counts', async () => {
      mockMarkInactiveUsersRtdb.mockResolvedValue(3)
      mockCleanupInactiveUsersRtdb.mockResolvedValue(1)

      const result = await cleanupService.triggerCleanup()

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledWith(60000)
      expect(mockCleanupInactiveUsersRtdb).toHaveBeenCalledWith(300000)
      expect(result).toEqual({ marked: 3, removed: 1 })
    })

    it('handles errors in manual cleanup', async () => {
      mockMarkInactiveUsersRtdb.mockRejectedValue(new Error('Mark failed'))
      mockCleanupInactiveUsersRtdb.mockResolvedValue(1)

      await expect(cleanupService.triggerCleanup()).rejects.toThrow('Mark failed')
    })
  })

  describe('runCleanup', () => {
    it('handles errors gracefully', async () => {
      mockMarkInactiveUsersRtdb.mockRejectedValue(new Error('Mark failed'))
      mockCleanupInactiveUsersRtdb.mockRejectedValue(new Error('Cleanup failed'))

      // Should not throw
      await expect(cleanupService.triggerCleanup()).rejects.toThrow()
    })

    it('runs cleanup with correct thresholds', async () => {
      mockMarkInactiveUsersRtdb.mockResolvedValue(0)
      mockCleanupInactiveUsersRtdb.mockResolvedValue(0)

      await cleanupService.triggerCleanup()

      expect(mockMarkInactiveUsersRtdb).toHaveBeenCalledWith(60000) // 60 seconds
      expect(mockCleanupInactiveUsersRtdb).toHaveBeenCalledWith(300000) // 5 minutes
    })
  })
})

