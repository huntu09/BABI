// Service Worker for Push Notifications
const CACHE_NAME = "dropiyo-v1"
const urlsToCache = ["/", "/dashboard", "/icon-192x192.png", "/icon-512x512.png"]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
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
