// Performance monitoring utilities (Client-side only)
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null
  private metrics: Map<string, number[]> = new Map()

  static getInstance() {
    // Only create on client side
    if (typeof window === "undefined") {
      return {
        measure: (name: string, fn: () => any) => fn(),
        measureAsync: async (name: string, fn: () => Promise<any>) => fn(),
        getStats: () => null,
        logAllStats: () => {},
      }
    }

    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  measure(name: string, fn: () => any): any {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return fn()
    }

    const start = performance.now()
    const result = fn()
    const end = performance.now()

    this.recordMetric(name, end - start)
    return result
  }

  async measureAsync(name: string, fn: () => Promise<any>): Promise<any> {
    if (typeof window === "undefined" || typeof performance === "undefined") {
      return fn()
    }

    const start = performance.now()
    const result = await fn()
    const end = performance.now()

    this.recordMetric(name, end - start)
    return result
  }

  private recordMetric(name: string, duration: number) {
    if (typeof window === "undefined") return

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(duration)

    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  getStats(name: string) {
    if (typeof window === "undefined") return null

    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) return null

    const sorted = [...metrics].sort((a, b) => a - b)
    return {
      count: metrics.length,
      avg: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  logAllStats() {
    if (typeof window === "undefined" || typeof console === "undefined") return

    console.group("Performance Stats")
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name)
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          count: stats.count,
        })
      }
    }
    console.groupEnd()
  }
}

export const perfMonitor = PerformanceMonitor.getInstance()
