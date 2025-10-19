/**
 * Throttle function calls to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

/**
 * Debounce function calls to delay execution until after calls have stopped
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Batch multiple operations together for better performance
 */
export class Batcher<T> {
  private batch: T[] = []
  private timeoutId: NodeJS.Timeout | null = null
  private readonly delay: number
  private readonly processor: (items: T[]) => void | Promise<void>

  constructor(processor: (items: T[]) => void | Promise<void>, delay: number = 16) {
    this.processor = processor
    this.delay = delay
  }

  add(item: T): void {
    this.batch.push(item)
    this.scheduleProcess()
  }

  addMany(items: T[]): void {
    this.batch.push(...items)
    this.scheduleProcess()
  }

  private scheduleProcess(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    this.timeoutId = setTimeout(() => {
      this.process()
    }, this.delay)
  }

  private async process(): Promise<void> {
    if (this.batch.length === 0) return

    const itemsToProcess = [...this.batch]
    this.batch = []
    this.timeoutId = null

    try {
      await this.processor(itemsToProcess)
    } catch (error) {
      console.error('Batch processing error:', error)
    }
  }

  flush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.process()
  }
}

/**
 * Memoize function results based on arguments
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Create a memoized selector for React components
 */
export function createSelector<T, R>(
  selectors: ((state: T) => any)[],
  resultFunc: (...args: any[]) => R
): (state: T) => R {
  let lastResult: R
  let lastDeps: any[]

  return (state: T) => {
    const deps = selectors.map(selector => selector(state))
    
    if (lastDeps && deps.every((dep, index) => dep === lastDeps[index])) {
      return lastResult
    }

    lastResult = resultFunc(...deps)
    lastDeps = deps
    return lastResult
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()

  static start(label: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, [])
      }
      
      this.measurements.get(label)!.push(duration)
      
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`${label}: ${duration.toFixed(2)}ms`)
      }
    }
  }

  static getStats(label: string): { avg: number; min: number; max: number; count: number } | null {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) return null

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
    const min = Math.min(...measurements)
    const max = Math.max(...measurements)
    const count = measurements.length

    return { avg, min, max, count }
  }

  static clear(label?: string): void {
    if (label) {
      this.measurements.delete(label)
    } else {
      this.measurements.clear()
    }
  }
}

/**
 * Intersection observer for lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  })
}

/**
 * Request animation frame scheduler
 */
export class AnimationScheduler {
  private callbacks: Set<() => void> = new Set()
  private isScheduled = false

  schedule(callback: () => void): void {
    this.callbacks.add(callback)
    
    if (!this.isScheduled) {
      this.isScheduled = true
      requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  private flush(): void {
    this.isScheduled = false
    const callbacks = Array.from(this.callbacks)
    this.callbacks.clear()
    
    callbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Animation callback error:', error)
      }
    })
  }
}

/**
 * Memory usage utilities
 */
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }
  return null
}

/**
 * Cleanup utilities
 */
export function createCleanupManager() {
  const cleanupFunctions: (() => void)[] = []

  return {
    add: (cleanup: () => void) => {
      cleanupFunctions.push(cleanup)
    },
    cleanup: () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Cleanup error:', error)
        }
      })
      cleanupFunctions.length = 0
    }
  }
}
