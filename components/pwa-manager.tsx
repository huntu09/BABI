"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    registerServiceWorker()
    setupPWAListeners()
    checkOnlineStatus()
    checkIfInstalled()
  }, [])

  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        setSwRegistration(registration)

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
                toast({
                  title: "Update Available! 🚀",
                  description: "A new version of the app is ready. Click to update.",
                  duration: 10000,
                })
              }
            })
          }
        })

        console.log("✅ Service Worker registered successfully")
        toast({
          title: "PWA Ready! 📱",
          description: "App is now available offline and can be installed",
        })
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error)
      }
    }
  }

  const setupPWAListeners = () => {
    // Install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    })

    // App installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast({
        title: "App Installed! 🎉",
        description: "Dropiyo has been added to your home screen",
      })
    })
  }

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine)

    window.addEventListener("online", () => {
      setIsOnline(true)
      toast({
        title: "Back Online! 🌐",
        description: "Internet connection restored",
      })
    })

    window.addEventListener("offline", () => {
      setIsOnline(false)
      toast({
        title: "Offline Mode 📴",
        description: "You can still use cached features",
        variant: "destructive",
      })
    })
  }

  const checkIfInstalled = () => {
    // Check if app is installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        toast({
          title: "Installing App... 📲",
          description: "Dropiyo is being added to your device",
        })
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error("Install prompt failed:", error)
    }
  }

  const handleUpdateClick = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }

  return (
    <>
      {/* Install Prompt */}
      {deferredPrompt && !isInstalled && (
        <Card className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-green-600 to-blue-600 border-0 md:left-auto md:right-4 md:w-80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white text-sm">Install Dropiyo</h4>
                <p className="text-white/80 text-xs">Add to home screen for better experience</p>
              </div>
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              >
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Card className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 border-0 md:left-auto md:right-4 md:w-80">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white text-sm">Update Available</h4>
                <p className="text-white/80 text-xs">New features and improvements ready</p>
              </div>
              <Button
                size="sm"
                onClick={handleUpdateClick}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-40">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline - Some features may be limited</span>
          </div>
        </div>
      )}

      {/* Online Indicator (brief) */}
      {isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-1 text-xs z-40 opacity-0 transition-opacity">
          <div className="flex items-center justify-center space-x-1">
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </div>
        </div>
      )}
    </>
  )
}
