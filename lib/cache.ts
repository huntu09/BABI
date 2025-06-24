// Simple in-memory cache with TTL (Client-side only)
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttlMs = 300000) {
    // Only run on client side
    if (typeof window === "undefined") return

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    })
  }

  get(key: string) {
    // Only run on client side
    if (typeof window === "undefined") return null

    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string) {
    if (typeof window === "undefined") return
    this.cache.delete(key)
  }

  clear() {
    if (typeof window === "undefined") return
    this.cache.clear()
  }

  cleanup() {
    if (typeof window === "undefined") return

    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// Only create cache on client side
export const cache = typeof window !== "undefined" ? new SimpleCache() : null

// Auto cleanup every 5 minutes (client-side only)
if (typeof window !== "undefined" && cache) {
  setInterval(() => cache.cleanup(), 300000)
}

// Cache helpers with null checks
export const cacheHelpers = {
  getUserProfile: (userId: string) => cache?.get(`profile:${userId}`) || null,
  setUserProfile: (userId: string, data: any) => cache?.set(`profile:${userId}`, data, 300000),

  getTasks: () => cache?.get("tasks:active") || null,
  setTasks: (data: any) => cache?.set("tasks:active", data, 600000),

  getWithdrawals: (userId: string) => cache?.get(`withdrawals:${userId}`) || null,
  setWithdrawals: (userId: string, data: any) => cache?.set(`withdrawals:${userId}`, data, 300000),
}
