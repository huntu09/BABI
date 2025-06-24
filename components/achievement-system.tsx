"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target, Users, DollarSign, Calendar, Award } from "lucide-react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: "tasks" | "earnings" | "referrals" | "streak" | "special"
  requirement: number
  current: number
  reward: number
  unlocked: boolean
  unlockedAt?: Date
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface AchievementSystemProps {
  user: any
  profile: any
  onAchievementUnlock?: (achievement: Achievement) => void
}

export default function AchievementSystem({ user, profile, onAchievementUnlock }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    initializeAchievements()
  }, [profile])

  const initializeAchievements = () => {
    const baseAchievements: Achievement[] = [
      // Task Achievements
      {
        id: "first_task",
        title: "First Steps",
        description: "Complete your first task",
        icon: "🚀",
        category: "tasks",
        requirement: 1,
        current: Math.min(profile?.completed_tasks || 0, 1),
        reward: 50,
        unlocked: (profile?.completed_tasks || 0) >= 1,
        rarity: "common",
      },
      {
        id: "task_master_10",
        title: "Task Master",
        description: "Complete 10 tasks",
        icon: "🎯",
        category: "tasks",
        requirement: 10,
        current: Math.min(profile?.completed_tasks || 0, 10),
        reward: 100,
        unlocked: (profile?.completed_tasks || 0) >= 10,
        rarity: "rare",
      },
      {
        id: "task_legend_50",
        title: "Task Legend",
        description: "Complete 50 tasks",
        icon: "🏆",
        category: "tasks",
        requirement: 50,
        current: Math.min(profile?.completed_tasks || 0, 50),
        reward: 500,
        unlocked: (profile?.completed_tasks || 0) >= 50,
        rarity: "epic",
      },
      {
        id: "task_god_100",
        title: "Task God",
        description: "Complete 100 tasks",
        icon: "👑",
        category: "tasks",
        requirement: 100,
        current: Math.min(profile?.completed_tasks || 0, 100),
        reward: 1000,
        unlocked: (profile?.completed_tasks || 0) >= 100,
        rarity: "legendary",
      },

      // Earnings Achievements
      {
        id: "first_dollar",
        title: "First Dollar",
        description: "Earn your first $1.00",
        icon: "💵",
        category: "earnings",
        requirement: 100,
        current: Math.min(profile?.total_earned || 0, 100),
        reward: 25,
        unlocked: (profile?.total_earned || 0) >= 100,
        rarity: "common",
      },
      {
        id: "money_maker",
        title: "Money Maker",
        description: "Earn $10.00 total",
        icon: "💰",
        category: "earnings",
        requirement: 1000,
        current: Math.min(profile?.total_earned || 0, 1000),
        reward: 100,
        unlocked: (profile?.total_earned || 0) >= 1000,
        rarity: "rare",
      },
      {
        id: "high_earner",
        title: "High Earner",
        description: "Earn $50.00 total",
        icon: "💎",
        category: "earnings",
        requirement: 5000,
        current: Math.min(profile?.total_earned || 0, 5000),
        reward: 250,
        unlocked: (profile?.total_earned || 0) >= 5000,
        rarity: "epic",
      },
      {
        id: "millionaire",
        title: "Point Millionaire",
        description: "Earn $100.00 total",
        icon: "🏦",
        category: "earnings",
        requirement: 10000,
        current: Math.min(profile?.total_earned || 0, 10000),
        reward: 500,
        unlocked: (profile?.total_earned || 0) >= 10000,
        rarity: "legendary",
      },

      // Referral Achievements
      {
        id: "first_referral",
        title: "Recruiter",
        description: "Get your first referral",
        icon: "🤝",
        category: "referrals",
        requirement: 1,
        current: Math.min(profile?.referral_count || 0, 1),
        reward: 100,
        unlocked: (profile?.referral_count || 0) >= 1,
        rarity: "common",
      },
      {
        id: "team_builder",
        title: "Team Builder",
        description: "Get 5 referrals",
        icon: "👥",
        category: "referrals",
        requirement: 5,
        current: Math.min(profile?.referral_count || 0, 5),
        reward: 250,
        unlocked: (profile?.referral_count || 0) >= 5,
        rarity: "rare",
      },
      {
        id: "network_master",
        title: "Network Master",
        description: "Get 25 referrals",
        icon: "🌐",
        category: "referrals",
        requirement: 25,
        current: Math.min(profile?.referral_count || 0, 25),
        reward: 1000,
        unlocked: (profile?.referral_count || 0) >= 25,
        rarity: "epic",
      },

      // Streak Achievements
      {
        id: "streak_3",
        title: "Getting Started",
        description: "3 day login streak",
        icon: "🔥",
        category: "streak",
        requirement: 3,
        current: Math.min(profile?.login_streak || 0, 3),
        reward: 50,
        unlocked: (profile?.login_streak || 0) >= 3,
        rarity: "common",
      },
      {
        id: "streak_7",
        title: "Week Warrior",
        description: "7 day login streak",
        icon: "⚡",
        category: "streak",
        requirement: 7,
        current: Math.min(profile?.login_streak || 0, 7),
        reward: 150,
        unlocked: (profile?.login_streak || 0) >= 7,
        rarity: "rare",
      },
      {
        id: "streak_30",
        title: "Monthly Master",
        description: "30 day login streak",
        icon: "🌟",
        category: "streak",
        requirement: 30,
        current: Math.min(profile?.login_streak || 0, 30),
        reward: 500,
        unlocked: (profile?.login_streak || 0) >= 30,
        rarity: "epic",
      },

      // Special Achievements
      {
        id: "early_bird",
        title: "Early Bird",
        description: "Join during beta period",
        icon: "🐦",
        category: "special",
        requirement: 1,
        current: 1,
        reward: 200,
        unlocked: true,
        rarity: "rare",
      },
      {
        id: "speed_demon",
        title: "Speed Demon",
        description: "Complete 5 tasks in one day",
        icon: "💨",
        category: "special",
        requirement: 5,
        current: Math.min(profile?.daily_tasks || 0, 5),
        reward: 100,
        unlocked: (profile?.daily_tasks || 0) >= 5,
        rarity: "rare",
      },
    ]

    setAchievements(baseAchievements)
  }

  const categories = [
    { id: "all", name: "All", icon: Trophy },
    { id: "tasks", name: "Tasks", icon: Target },
    { id: "earnings", name: "Earnings", icon: DollarSign },
    { id: "referrals", name: "Referrals", icon: Users },
    { id: "streak", name: "Streak", icon: Calendar },
    { id: "special", name: "Special", icon: Award },
  ]

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "from-gray-500 to-gray-600",
      rare: "from-blue-500 to-blue-600",
      epic: "from-purple-500 to-purple-600",
      legendary: "from-yellow-500 to-orange-500",
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBadgeColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-600",
      rare: "bg-blue-600",
      epic: "bg-purple-600",
      legendary: "bg-yellow-600",
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const filteredAchievements = achievements.filter((achievement) =>
    selectedCategory === "all" ? true : achievement.category === selectedCategory,
  )

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalRewards = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.reward, 0)

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{unlockedCount}</div>
            <div className="text-gray-400 text-sm">Unlocked</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{achievements.length}</div>
            <div className="text-gray-400 text-sm">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalRewards}</div>
            <div className="text-gray-400 text-sm">Bonus Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-gray-400 hover:bg-slate-700"
            }`}
          >
            <category.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid gap-4">
        {filteredAchievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`border-slate-700 transition-all duration-300 ${
              achievement.unlocked
                ? "bg-gradient-to-r " + getRarityColor(achievement.rarity) + " shadow-lg"
                : "bg-slate-800 opacity-75"
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                    achievement.unlocked ? "bg-white bg-opacity-20" : "bg-slate-700"
                  }`}
                >
                  {achievement.unlocked ? achievement.icon : "🔒"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`font-bold ${achievement.unlocked ? "text-white" : "text-gray-400"}`}>
                      {achievement.title}
                    </h3>
                    <Badge className={`${getRarityBadgeColor(achievement.rarity)} text-white text-xs`}>
                      {achievement.rarity}
                    </Badge>
                    {achievement.unlocked && <Badge className="bg-green-600 text-white text-xs">Unlocked</Badge>}
                  </div>
                  <p className={`text-sm mb-3 ${achievement.unlocked ? "text-gray-100" : "text-gray-500"}`}>
                    {achievement.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={achievement.unlocked ? "text-gray-200" : "text-gray-400"}>
                        Progress: {achievement.current}/{achievement.requirement}
                      </span>
                      <span className={`font-medium ${achievement.unlocked ? "text-green-200" : "text-gray-400"}`}>
                        +{achievement.reward} points
                      </span>
                    </div>
                    <Progress
                      value={(achievement.current / achievement.requirement) * 100}
                      className={`h-2 ${achievement.unlocked ? "bg-white bg-opacity-20" : "bg-slate-700"}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
