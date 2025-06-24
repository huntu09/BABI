"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Bell, Smartphone, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PushNotificationManagerProps {
  user: any
  profile: any
}

export default function PushNotificationManager({ user, profile }: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [settings, setSettings] = useState({
    newOffers: true,
    taskReminders: true,
    achievements: true,
    withdrawals: true,
    referrals: true,
    dailyBonus: true,
  })

  useEffect(() => {
    checkNotificationSupport()
    loadSettings()
  }, [])

  const checkNotificationSupport = () => {
    if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }

  const loadSettings = () => {
    const saved = localStorage.getItem(`push_settings_${user.id}`)
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported on this device",
        variant: "destructive",
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        await subscribeToPush()
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll now receive push notifications for important updates",
        })
      } else {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      })
    }
  }

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIHSUHVInqSHhMKpbYJC_elGDJVxRSaQKz4PJoRcKR4TOGc4Vck2I", // Demo key
        ),
      })

      // Send subscription to server
      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          userId: user.id,
          settings,
        }),
      })

      setIsSubscribed(true)
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
    }
  }

  const updateSetting = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem(`push_settings_${user.id}`, JSON.stringify(newSettings))

    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved",
    })
  }

  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("Test Notification 🧪", {
        body: "This is a test notification from Dropiyo!",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test",
      })
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const notificationTypes = [
    {
      key: "newOffers",
      title: "New Offers",
      description: "Get notified when high-paying offers become available",
      icon: "💎",
    },
    {
      key: "taskReminders",
      title: "Task Reminders",
      description: "Reminders for incomplete tasks and deadlines",
      icon: "⏰",
    },
    {
      key: "achievements",
      title: "Achievements",
      description: "Celebrate your milestones and unlocked achievements",
      icon: "🏆",
    },
    {
      key: "withdrawals",
      title: "Withdrawals",
      description: "Updates on your withdrawal requests and processing",
      icon: "💳",
    },
    {
      key: "referrals",
      title: "Referrals",
      description: "New referrals and commission earnings",
      icon: "👥",
    },
    {
      key: "dailyBonus",
      title: "Daily Bonus",
      description: "Daily login bonus and streak reminders",
      icon: "🎁",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                permission === "granted" ? "bg-green-600" : "bg-slate-700"
              }`}
            >
              {permission === "granted" ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <Bell className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Push Notifications</h3>
              <p className="text-gray-400 text-sm mb-3">
                {permission === "granted"
                  ? "Notifications are enabled and working"
                  : permission === "denied"
                    ? "Notifications are blocked. Enable them in browser settings."
                    : "Enable notifications to get real-time updates"}
              </p>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${permission === "granted" ? "bg-green-400" : "bg-red-400"}`}
                ></div>
                <span className="text-xs text-gray-400">{permission === "granted" ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enable Notifications */}
      {permission !== "granted" && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0">
          <CardContent className="p-6 text-center">
            <Smartphone className="h-12 w-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Stay Updated!</h3>
            <p className="text-blue-100 mb-4">
              Enable push notifications to get instant alerts about new offers, achievements, and more.
            </p>
            <Button
              onClick={requestPermission}
              disabled={!isSupported}
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
            >
              {!isSupported ? "Not Supported" : "Enable Notifications"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification Settings */}
      {permission === "granted" && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Notification Types</h3>
          <div className="space-y-3">
            {notificationTypes.map((type) => (
              <Card key={type.key} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{type.icon}</div>
                      <div>
                        <h4 className="font-medium text-white text-sm">{type.title}</h4>
                        <p className="text-gray-400 text-xs">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[type.key as keyof typeof settings]}
                      onCheckedChange={(checked) => updateSetting(type.key, checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Test Notification */}
      {permission === "granted" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white text-sm">Test Notification</h4>
                <p className="text-gray-400 text-xs">Send a test notification to verify it's working</p>
              </div>
              <Button size="sm" onClick={sendTestNotification} className="bg-green-600 hover:bg-green-700">
                Send Test
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Browser Support Info */}
      {!isSupported && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <div>
                <h4 className="font-medium text-white text-sm">Browser Not Supported</h4>
                <p className="text-gray-400 text-xs">
                  Your browser doesn't support push notifications. Try using Chrome, Firefox, or Safari.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
