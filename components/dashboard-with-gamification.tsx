"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { DollarSign, CreditCard, Gamepad2, Trophy } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import WithdrawalModal from "./withdrawal-modal"
import ProfilePage from "./profile-page-fixed"
import AdvancedOfferSystem from "./advanced-offer-system"
import RealTimeNotifications from "./real-time-notifications"
import GamificationSystem from "./gamification-system"

interface DashboardProps {
  user: any
  profile: any
}

export default function DashboardWithGamification({ user, profile }: DashboardProps) {
  const [points, setPoints] = useState(profile?.points || 0)
  const [activeTab, setActiveTab] = useState("earn")
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")

  const supabase = createClientComponentClient()
  const router = useRouter()

  // Calculate user level
  const levels = [
    { level: 1, name: "Rookie", minPoints: 0, maxPoints: 999, icon: "🌱", color: "from-gray-500 to-gray-600" },
    { level: 2, name: "Explorer", minPoints: 1000, maxPoints: 2499, icon: "🗺️", color: "from-green-500 to-green-600" },
    { level: 3, name: "Adventurer", minPoints: 2500, maxPoints: 4999, icon: "⚔️", color: "from-blue-500 to-blue-600" },
    {
      level: 4,
      name: "Champion",
      minPoints: 5000,
      maxPoints: 9999,
      icon: "🏆",
      color: "from-purple-500 to-purple-600",
    },
    {
      level: 5,
      name: "Legend",
      minPoints: 10000,
      maxPoints: 19999,
      icon: "👑",
      color: "from-orange-500 to-orange-600",
    },
    { level: 6, name: "Mythic", minPoints: 20000, maxPoints: 49999, icon: "🔥", color: "from-red-500 to-red-600" },
    { level: 7, name: "Divine", minPoints: 50000, maxPoints: 99999, icon: "✨", color: "from-pink-500 to-pink-600" },
    {
      level: 8,
      name: "Immortal",
      minPoints: 100000,
      maxPoints: 999999,
      icon: "💎",
      color: "from-yellow-400 to-yellow-500",
    },
  ]

  const userPoints = profile?.total_earned || 0
  const currentLevel =
    levels.find((level) => userPoints >= level.minPoints && userPoints <= level.maxPoints) || levels[0]

  // If profile page is shown, render it instead of dashboard
  if (showProfilePage) {
    return <ProfilePage user={user} profile={profile} onBack={() => setShowProfilePage(false)} />
  }

  const handleOfferComplete = (earnedPoints: number) => {
    setPoints(points + earnedPoints)
  }

  const handleNotificationClick = (notification: any) => {
    // Handle notification clicks - navigate to relevant sections
    switch (notification.type) {
      case "offer":
        setActiveTab("earn")
        break
      case "withdrawal":
        setActiveTab("cashout")
        break
      case "achievement":
        setActiveTab("gamification")
        break
      default:
        break
    }
  }

  const handleClaimBonus = async () => {
    try {
      const response = await fetch("/api/claim-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusType: "daily_login", points: 25 }),
      })

      const data = await response.json()

      if (data.success) {
        setPoints(points + 25)
        toast({
          title: "Bonus Claimed! 🎉",
          description: "You earned 25 points for your daily login streak!",
        })
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim bonus",
        variant: "destructive",
      })
    }
  }

  const renderEarnTab = () => (
    <div className="px-4 pt-6 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Earn Points</h2>
        <p className="text-gray-400 text-sm">Complete offers, surveys, and tasks to earn points</p>
      </div>

      <AdvancedOfferSystem user={user} profile={profile} onOfferComplete={handleOfferComplete} />
    </div>
  )

  const renderMyOffersTab = () => (
    <div className="px-4 pt-6 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">My Offers</h2>
      {/* This will show completed offers - can be enhanced later */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-2">Your completed offers will appear here</div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCashoutTab = () => {
    const paymentMethods = [
      {
        id: "dana",
        name: "DANA",
        icon: "💳",
        minimum: "$2.00",
        fee: "Free",
        processingTime: "Instant",
        color: "from-blue-600 to-blue-700",
        popular: true,
      },
      {
        id: "gopay",
        name: "GoPay",
        icon: "🟢",
        minimum: "$2.00",
        fee: "Free",
        processingTime: "Instant",
        color: "from-green-600 to-green-700",
        popular: true,
      },
    ]

    return (
      <div className="px-4 pt-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-6">Cashout</h2>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 mb-6">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">${(points / 100).toFixed(2)}</div>
            <div className="text-green-100 mb-4">Available Balance</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-white">{points}</div>
                <div className="text-green-100">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${((profile?.total_earned || 0) / 100).toFixed(2)}</div>
                <div className="text-green-100">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
                onClick={() => {
                  if (points < 200) {
                    toast({
                      title: "Insufficient Balance",
                      description: "Minimum withdrawal is $2.00 (200 points)",
                      variant: "destructive",
                    })
                    return
                  }
                  setSelectedPaymentMethod(method.id)
                  setShowWithdrawalModal(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white">{method.name}</h4>
                        {method.popular && <Badge className="bg-green-600 text-white text-xs">Popular</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-1">
                        <div>Min: {method.minimum}</div>
                        <div>Fee: {method.fee}</div>
                        <div>{method.processingTime}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderGamificationTab = () => (
    <div className="px-4 pt-6 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Gamification</h2>
        <p className="text-gray-400 text-sm">Levels, badges, leaderboards, and achievements</p>
      </div>

      <GamificationSystem user={user} profile={profile} />
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Enhanced Header with Level */}
      <div className="flex items-center justify-between p-4 pt-12">
        {/* Profile Circle with Level */}
        <div
          className="flex items-center space-x-3 cursor-pointer hover:bg-slate-800 rounded-lg p-2 transition-colors"
          onClick={() => setShowProfilePage(true)}
        >
          <div className="w-12 h-12 rounded-full border-2 border-green-400 flex items-center justify-center">
            <span className="text-green-400 font-bold text-lg">
              {profile?.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-white font-medium text-sm">{profile?.username || "User"}</div>
            <div className="flex items-center space-x-1">
              <span className="text-xs">{currentLevel.icon}</span>
              <span className="text-xs text-gray-400">Level {currentLevel.level}</span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-white" />
          <span className="text-white font-bold text-lg">${(points / 100).toFixed(2)}</span>
        </div>

        {/* Real-time Notifications */}
        <RealTimeNotifications user={user} profile={profile} onNotificationClick={handleNotificationClick} />
      </div>

      {/* Level Progress Bar */}
      <div className="px-4 mb-4">
        <Card className={`bg-gradient-to-r ${currentLevel.color} border-0 text-white`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{currentLevel.icon}</span>
                <div>
                  <div className="font-bold">{currentLevel.name}</div>
                  <div className="text-xs opacity-75">Level {currentLevel.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{userPoints.toLocaleString()} pts</div>
                <div className="text-xs opacity-75">
                  {Math.max(
                    0,
                    (levels.find((l) => l.level === currentLevel.level + 1)?.minPoints || currentLevel.maxPoints) -
                      userPoints,
                  ).toLocaleString()}{" "}
                  to next
                </div>
              </div>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, ((userPoints - currentLevel.minPoints) / (currentLevel.maxPoints - currentLevel.minPoints)) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content based on active tab */}
      {activeTab === "earn" && renderEarnTab()}
      {activeTab === "offers" && renderMyOffersTab()}
      {activeTab === "cashout" && renderCashoutTab()}
      {activeTab === "gamification" && renderGamificationTab()}

      {/* Enhanced Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center justify-around py-3">
          <button
            onClick={() => setActiveTab("earn")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "earn" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-xs font-medium">Earn</span>
          </button>

          <button
            onClick={() => setActiveTab("offers")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "offers" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <Gamepad2 className="h-6 w-6" />
            <span className="text-xs">My Offers</span>
          </button>

          <button
            onClick={() => setActiveTab("cashout")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "cashout" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs">Cashout</span>
          </button>

          <button
            onClick={() => setActiveTab("gamification")}
            className={`flex flex-col items-center space-y-1 relative ${
              activeTab === "gamification" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <Trophy className="h-6 w-6" />
            <span className="text-xs">Rewards</span>
            {/* Level badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">{currentLevel.level}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showWithdrawalModal && (
        <WithdrawalModal
          paymentMethod={selectedPaymentMethod}
          currentBalance={points}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={(amount) => {
            setPoints(points - amount)
            setShowWithdrawalModal(false)
          }}
        />
      )}
    </div>
  )
}
