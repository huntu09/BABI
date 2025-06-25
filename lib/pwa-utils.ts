export class PWAUtils {
  static async isServiceWorkerSupported(): Promise<boolean> {
    return "serviceWorker" in navigator
  }

  static async isInstalled(): Promise<boolean> {
    return window.matchMedia("(display-mode: standalone)").matches
  }

  static async getInstallPrompt(): Promise<any> {
    return new Promise((resolve) => {
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault()
        resolve(e)
      })
    })
  }

  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!(await this.isServiceWorkerSupported())) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("✅ Service Worker registered:", registration.scope)
      return registration
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error)
      return null
    }
  }

  static async checkForUpdates(registration: ServiceWorkerRegistration): Promise<boolean> {
    await registration.update()
    return !!registration.waiting
  }

  static async skipWaiting(registration: ServiceWorkerRegistration): Promise<void> {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
  }

  static getNetworkStatus(): boolean {
    return navigator.onLine
  }

  static onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }

  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      return "denied"
    }

    return await Notification.requestPermission()
  }

  static showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      })
    }
  }

  static async getCacheSize(): Promise<number> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    }
    return 0
  }

  static async clearCache(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
  }
}
