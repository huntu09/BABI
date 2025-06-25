"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Wifi, Bell, Download, CheckCircle, AlertCircle } from "lucide-react"

export default function PWAStatus() {
  const [status, setStatus] = useState({
    serviceWorker: false,
    manifest: false,
    installable: false,
    notifications: false,
    offline: false,
    installed: false,
  })

  useEffect(() => {
    checkPWAStatus()
  }, [])

  const checkPWAStatus = async () => {
    const newStatus = {
      serviceWorker: "serviceWorker" in navigator,
      manifest: document.querySelector('link[rel="manifest"]') !== null,
      installable: false,
      notifications: "Notification" in window && Notification.permission === "granted",
      offline: !navigator.onLine,
      installed: window.matchMedia("(display-mode: standalone)").matches,
    }

    // Check if service worker is actually registered
    if (newStatus.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        newStatus.serviceWorker = !!registration
      } catch (error) {
        newStatus.serviceWorker = false
      }
    }

    setStatus(newStatus)
  }

  const features = [
    {
      name: "Service Worker",
      status: status.serviceWorker,
      icon: CheckCircle,
      description: "Offline functionality & caching",
    },
    {
      name: "Web Manifest",
      status: status.manifest,
      icon: Smartphone,
      description: "App-like experience",
    },
    {
      name: "Push Notifications",
      status: status.notifications,
      icon: Bell,
      description: "Real-time updates",
    },
    {
      name: "Installed",
      status: status.installed,
      icon: Download,
      description: "Added to home screen",
    },
    {
      name: "Online Status",
      status: !status.offline,
      icon: Wifi,
      description: "Internet connectivity",
    },
  ]

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">PWA Status</h3>
          <Badge variant={Object.values(status).filter(Boolean).length >= 4 ? "default" : "secondary"}>
            {Object.values(status).filter(Boolean).length}/5 Active
          </Badge>
        </div>

        <div className="space-y-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.name} className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    feature.status ? "bg-green-600" : "bg-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm">{feature.name}</span>
                    {feature.status ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-gray-500 text-center">
            PWA Score: {Math.round((Object.values(status).filter(Boolean).length / 5) * 100)}%
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
