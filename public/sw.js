// Service Worker for Push Notifications
const CACHE_NAME = "dropiyo-v1"

const OFFLINE_URL = "/offline"
const FALLBACK_IMAGE = "/placeholder.svg?height=200&width=200"

// Update urlsToCache untuk include offline page
const urlsToCache = [
  "/",
  "/dashboard",
  "/offline",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/placeholder.svg?height=200&width=200",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Tambahkan setelah install event
// Activate event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim()
      }),
  )
})

// Update fetch event untuk better offline handling
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Handle navigation requests
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline") || caches.match("/")
      }),
    )
    return
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).catch(() => {
        // Return fallback for images
        if (event.request.destination === "image") {
          return caches.match(FALLBACK_IMAGE)
        }

        // Return offline page for HTML requests
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("/offline")
        }
      })
    }),
  )
})

// Push event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification from Dropiyo!",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "View Offers",
        icon: "/icon-192x192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Dropiyo", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(clients.openWindow("/dashboard"))
  } else if (event.action === "close") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Tambahkan message handler untuk update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
