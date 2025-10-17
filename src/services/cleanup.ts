import { markInactiveUsersRtdb, cleanupInactiveUsersRtdb } from './realtime'

// Cleanup configuration
const CLEANUP_INTERVAL_MS = 60000 // Run every 60 seconds
const INACTIVE_USER_THRESHOLD_MS = 60000 // Mark users as inactive after 60 seconds
const REMOVAL_THRESHOLD_MS = 300000 // Remove users after 5 minutes (300 seconds)

class CleanupService {
  private intervalId: number | null = null
  private isRunning = false

  start(): void {
    if (this.isRunning) {
      console.log('🧹 Cleanup service is already running')
      return
    }

    console.log('🧹 Starting cleanup service...')
    this.isRunning = true
    
    // Run cleanup immediately
    this.runCleanup()
    
    // Set up periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup()
    }, CLEANUP_INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🧹 Cleanup service stopped')
  }

  private async runCleanup(): Promise<void> {
    try {
      // First, mark users as inactive after 60 seconds
      const markedCount = await markInactiveUsersRtdb(INACTIVE_USER_THRESHOLD_MS)
      if (markedCount > 0) {
        console.log(`🟡 Marked ${markedCount} users as inactive (disabled green light)`)
      }
      
      // Then, remove users after 5 minutes
      const removedCount = await cleanupInactiveUsersRtdb(REMOVAL_THRESHOLD_MS)
      if (removedCount > 0) {
        console.log(`🧹 Removed ${removedCount} inactive users after 5 minutes`)
      }
    } catch (error) {
      console.error('🧹 Cleanup service error:', error)
    }
  }

  // Manual cleanup trigger (useful for testing)
  async triggerCleanup(): Promise<{ marked: number; removed: number }> {
    const marked = await markInactiveUsersRtdb(INACTIVE_USER_THRESHOLD_MS)
    const removed = await cleanupInactiveUsersRtdb(REMOVAL_THRESHOLD_MS)
    return { marked, removed }
  }
}

// Singleton instance
export const cleanupService = new CleanupService()

// Auto-start cleanup service when module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  cleanupService.start()
}
