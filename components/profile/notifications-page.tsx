"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Mail, Smartphone, Zap, Gift, Trash2, BookMarkedIcon as MarkAsRead } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"

interface NotificationsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function NotificationsPage({ user, profile, onBack }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    offers: true,
    rewards: false,
    withdrawals: true,
    referrals: true,
  })
  const [recentNotifications, setRecentNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadNotificationSettings()
    loadRecentNotifications()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      // Load from localStorage or database
      const saved = localStorage.getItem(`notifications_${user.id}`)
      if (saved) {
        setNotifications(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading notification settings:", error)
    }
  }

  const loadRecentNotifications = () => {
    // Mock notifications - in real app, load from database
    const mockNotifications = [
      {
        id: 1,
        title: "New High-Paying Offer Available!",
        description: "Earn $25.00 by completing a simple survey",
        time: "2 hours ago",
        type: "offer",
        unread: true,
        icon: "🎯",
      },
      {
        id: 2,
        title: "Withdrawal Completed",
        description: "Your $10.00 withdrawal to DANA has been processed",
        time: "1 day ago",
        type: "withdrawal",
        unread: false,
        icon: "💳",
      },
      {
        id: 3,
        title: "New Referral Joined!",
        description: "You earned $1.25 commission from your referral",
        time: "2 days ago",
        type: "referral",
        unread: false,
        icon: "👥",
      },
      {
        id: 4,
        title: "Daily Bonus Available",
        description: "Don't forget to claim your daily login bonus",
        time: "3 days ago",
        type: "bonus",
        unread: false,
        icon: "🎁",
      },
    ]
    setRecentNotifications(mockNotifications)
  }

  const updateNotificationSetting = async (key: string, value: boolean) => {
    const newSettings = { ...notifications, [key]: value }
    setNotifications(newSettings)

    try {
      // Save to localStorage
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(newSettings))

      toast({
        title: "Settings Updated! ✅",
        description: "Your notification preferences have been saved.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      })
    }
  }

  const markAsRead = (notificationId: number) => {
    setRecentNotifications((prev) =>
      prev.map((notif: any) => (notif.id === notificationId ? { ...notif, unread: false } : notif)),
    )
  }

  const markAllAsRead = () => {
    setRecentNotifications((prev) => prev.map((notif: any) => ({ ...notif, unread: false })))
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated.",
    })
  }

  const deleteNotification = (notificationId: number) => {
    setRecentNotifications((prev) => prev.filter((notif: any) => notif.id !== notificationId))
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    })
  }

  const notificationSettings = [
    {
      key: "email",
      title: "Email Notifications",
      description: "Receive updates via email",
      icon: Mail,
    },
    {
      key: "push",
      title: "Push Notifications",
      description: "Get notified about new offers",
      icon: Smartphone,
    },
    {
      key: "offers",
      title: "New Offers",
      description: "High-paying offer notifications",
      icon: Zap,
    },
    {
      key: "rewards",
      title: "Rewards & Bonuses",
      description: "Achievement and bonus alerts",
      icon: Gift,
    },
    {
      key: "withdrawals",
      title: "Withdrawal Updates",
      description: "Status updates for withdrawals",
      icon: Bell,
    },
    {
      key: "referrals",
      title: "Referral Activity",
      description: "New referrals and commissions",
      icon: Bell,
    },
  ]

  const unreadCount = recentNotifications.filter((notif: any) => notif.unread).length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-medium">Notifications</h1>
          {unreadCount > 0 && <Badge className="bg-red-600 text-white text-xs">{unreadCount}</Badge>}
        </div>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* Quick Actions */}
        {unreadCount > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              <MarkAsRead className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        )}

        {/* Recent Notifications */}
        <div>
          <h3 className="text-white font-medium mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {recentNotifications.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-400 mb-2">No notifications yet</div>
                  <p className="text-gray-500 text-sm">You'll see notifications here when you have them</p>
                </CardContent>
              </Card>
            ) : (
              recentNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`bg-slate-800 border-slate-700 ${notification.unread ? "border-l-4 border-l-green-400" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="text-2xl">{notification.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                            {notification.unread && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                          </div>
                          <p className="text-gray-400 text-xs mb-2">{notification.description}</p>
                          <div className="text-gray-500 text-xs">{notification.time}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {notification.unread && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="text-green-400 hover:text-green-300 p-1"
                          >
                            <MarkAsRead className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h3 className="text-white font-medium mb-4">Notification Preferences</h3>
          <div className="space-y-1">
            {notificationSettings.map((setting) => (
              <Card key={setting.key} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <setting.icon className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-white text-sm">{setting.title}</div>
                        <div className="text-gray-400 text-xs">{setting.description}</div>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[setting.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => updateNotificationSetting(setting.key, checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Notification Schedule */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4">Quiet Hours</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm">Enable Quiet Hours</div>
                  <div className="text-gray-400 text-xs">Disable notifications during specific hours</div>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <div className="grid grid-cols-2 gap-4 opacity-50">
                <div>
                  <label className="text-gray-300 text-sm">From</label>
                  <select
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white mt-1"
                    disabled
                  >
                    <option>22:00</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm">To</label>
                  <select
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white mt-1"
                    disabled
                  >
                    <option>08:00</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
