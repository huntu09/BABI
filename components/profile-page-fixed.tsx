"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { UserIcon, Settings, Bell, Users, CreditCard, Trophy, Star, Gift, ArrowLeft } from "lucide-react"

// Import sub-pages
import SettingsPage from "@/components/profile/settings-page"
import NotificationsPage from "@/components/profile/notifications-page"
import ReferralsPage from "@/components/profile/referrals-page"
import WithdrawalsPage from "@/components/profile/withdrawals-page"

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  points: number
  level: number
  total_earned: number
  referral_count: number
  completed_offers: number
  created_at: string
}

interface ProfilePageProps {
  user: UserProfile
  onBack: () => void
}

export default function ProfilePage({ user, onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const levelProgress = ((user.points % 1000) / 1000) * 100

  const stats = [
    {
      label: "Total Earned",
      value: `$${user.total_earned.toFixed(2)}`,
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      label: "Current Points",
      value: user.points.toLocaleString(),
      icon: Star,
      color: "text-yellow-600",
    },
    {
      label: "Referrals",
      value: user.referral_count.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Completed Offers",
      value: user.completed_offers.toString(),
      icon: Trophy,
      color: "text-purple-600",
    },
  ]

  if (activeTab === "settings") {
    return <SettingsPage user={user} onBack={() => setActiveTab("overview")} />
  }

  if (activeTab === "notifications") {
    return <NotificationsPage user={user} onBack={() => setActiveTab("overview")} />
  }

  if (activeTab === "referrals") {
    return <ReferralsPage user={user} onBack={() => setActiveTab("overview")} />
  }

  if (activeTab === "withdrawals") {
    return <WithdrawalsPage user={user} onBack={() => setActiveTab("overview")} />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user.full_name || "User"}</h1>
                <p className="text-gray-600">{user.email}</p>

                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    Level {user.level}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {user.points} Points
                  </Badge>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Level Progress</span>
                    <span>{Math.round(levelProgress)}%</span>
                  </div>
                  <Progress value={levelProgress} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <div className="p-1 bg-green-100 rounded">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Offer Completed</p>
                        <p className="text-sm text-gray-600">Earned 500 points</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="p-1 bg-blue-100 rounded">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">New Referral</p>
                        <p className="text-sm text-gray-600">Friend joined via your link</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <div className="p-1 bg-purple-100 rounded">
                        <Star className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Level Up!</p>
                        <p className="text-sm text-gray-600">Reached Level {user.level}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your account and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("withdrawals")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    View Withdrawals
                  </Button>

                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("referrals")}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Referrals
                  </Button>

                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("settings")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
