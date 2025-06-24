"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { Gift, Star, Trophy, Zap, Clock, CheckCircle, DollarSign, TrendingUp } from "lucide-react"

interface RewardsTabProps {
  onClaimBonus?: () => void
  profile?: any
}

export default function RewardsTab({ onClaimBonus, profile }: RewardsTabProps) {
  const [isClaimingBonus, setIsClaimingBonus] = useState(false)
  const [bonusStatus, setBonusStatus] = useState({
    claimed: false,
    amount: 25,
    streak: 1,
    nextBonusIn: "00:00:00",
    bonusDetails: null,
    nextBonus: null,
  })
  const [achievements, setAchievements] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkBonusStatus()
    const interval = setInterval(updateCountdown, 1000)
    fetchAchievements()
    return () => clearInterval(interval)
  }, [])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/achievements")
      const data = await response.json()

      if (data.success) {
        setAchievements(data.achievements)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkBonusStatus = async () => {
    try {
      const response = await fetch("/api/daily-bonus-status")
      const data = await response.json()

      if (data.success) {
        setBonusStatus((prev) => ({
          ...prev,
          claimed: data.claimed,
          streak: data.profile?.loginStreak || 1,
          amount: data.nextBonus?.amount || 25,
          bonusDetails: data.bonusDetails,
          nextBonus: data.nextBonus,
        }))
      }
    } catch (error) {
      console.error("Error checking bonus status:", error)
    }
  }

  const updateCountdown = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const diff = tomorrow.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    setBonusStatus((prev) => ({
      ...prev,
      nextBonusIn: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    }))
  }

  const handleClaimBonus = async () => {
    if (isClaimingBonus || bonusStatus.claimed) return

    setIsClaimingBonus(true)

    try {
      const response = await fetch("/api/daily-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        setBonusStatus((prev) => ({ ...prev, claimed: true }))
        toast({
          title: "Daily Bonus Claimed! 🎉",
          description: data.message,
        })

        // Trigger notification update
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("dailyBonusClaimed", {
              detail: { amount: data.bonusAmount, newBalance: data.newBalance },
            }),
          )
        }

        onClaimBonus?.()
        // Refresh data after bonus claim
        fetchAchievements()
        checkBonusStatus()
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
    } finally {
      setIsClaimingBonus(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Real Balance Display */}
      {stats && (
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6" />
                <div>
                  <div className="text-2xl font-bold">${stats.currentBalance?.toFixed(2) || "0.00"}</div>
                  <div className="text-sm text-green-100">Current Balance</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">${stats.totalEarned?.toFixed(2) || "0.00"}</div>
                <div className="text-sm text-green-100">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Bonus Card - REAL DATA */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="h-6 w-6" />
              <CardTitle className="text-xl">Daily Bonus</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Streak: {bonusStatus.streak}
            </Badge>
          </div>
          <CardDescription className="text-purple-100">
            {bonusStatus.claimed
              ? `Bonus claimed! Come back tomorrow for ${bonusStatus.nextBonus?.amount || 25} points.`
              : "Claim your daily reward and build your streak!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {bonusStatus.claimed
                  ? `${bonusStatus.bonusDetails?.amount || bonusStatus.amount} Points`
                  : `${bonusStatus.amount} Points`}
              </div>
              {bonusStatus.nextBonus && !bonusStatus.claimed && (
                <div className="text-sm text-purple-200 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  {bonusStatus.nextBonus.baseAmount} base + {bonusStatus.nextBonus.streakBonus} streak bonus
                </div>
              )}
              {!bonusStatus.claimed && (
                <div className="text-sm text-purple-200 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  Next bonus in: {bonusStatus.nextBonusIn}
                </div>
              )}
            </div>
            <Button
              onClick={handleClaimBonus}
              disabled={isClaimingBonus || bonusStatus.claimed}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              {isClaimingBonus ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : bonusStatus.claimed ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Claimed
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section - REAL DATA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
          </div>
          {stats && (
            <div className="flex space-x-2">
              <Badge className="bg-blue-600 text-white">{stats.completedTasks} tasks</Badge>
              <Badge className="bg-purple-600 text-white">{stats.earnedBadges} badges</Badge>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading real achievements data...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h3 className="font-medium text-white">{achievement.title}</h3>
                        <p className="text-sm text-gray-400">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-400">+{achievement.reward} pts</div>
                      {achievement.unlocked && (
                        <Badge className="bg-green-600 text-white text-xs mt-1">
                          {achievement.earned ? "Earned" : "Completed"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">
                        {achievement.current}/{achievement.requirement} (
                        {Math.round((achievement.current / achievement.requirement) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(achievement.current / achievement.requirement) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Real Stats Summary */}
      {stats && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Your Real Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{stats.completedTasks}</div>
                <div className="text-sm text-gray-400">Tasks Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
                <div className="text-sm text-gray-400">Login Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.referrals}</div>
                <div className="text-sm text-gray-400">Referrals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${stats.totalTaskRewards?.toFixed(2) || "0.00"}</div>
                <div className="text-sm text-gray-400">Task Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
