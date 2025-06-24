"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Bell, Mail, Smartphone, Zap, Gift } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Notifications</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
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
                      onCheckedChange={(checked) => setNotifications({ ...notifications, [setting.key]: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <h3 className="text-white font-medium mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {[
              {
                title: "New High-Paying Offer Available!",
                description: "Earn $25.00 by completing a simple survey",
                time: "2 hours ago",
                type: "offer",
                unread: true,
              },
              {
                title: "Withdrawal Completed",
                description: "Your $10.00 withdrawal to DANA has been processed",
                time: "1 day ago",
                type: "withdrawal",
                unread: false,
              },
              {
                title: "New Referral Joined!",
                description: "You earned $1.25 commission from your referral",
                time: "2 days ago",
                type: "referral",
                unread: false,
              },
            ].map((notification, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? "bg-green-400" : "bg-gray-600"}`}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{notification.title}</div>
                      <div className="text-gray-400 text-xs mt-1">{notification.description}</div>
                      <div className="text-gray-500 text-xs mt-2">{notification.time}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
